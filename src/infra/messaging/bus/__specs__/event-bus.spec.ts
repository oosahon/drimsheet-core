import eventValue from '@shared/values/events/event.vo';

import reporter from '@infra/integrations/sentry/sentry-reporter';
import eventBus from '@infra/messaging/bus/event-bus';

jest.mock('@infra/integrations/sentry/sentry-reporter', () => ({
  __esModule: true,
  default: {
    report: jest.fn(),
  },
}));

describe('eventBus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('waits for subscribers to finish', async () => {
    const eventType = 'domain:test:awaited-publication';
    let finishHandler: (() => void) | undefined;
    const handlerCompletion = new Promise<void>((resolve) => {
      finishHandler = resolve;
    });
    eventBus.subscribe(eventType, async () => handlerCompletion);

    let publicationCompleted = false;
    const publication = eventBus
      .publish(eventValue.make({ type: eventType, data: { id: 'test' } }))
      .then(() => {
        publicationCompleted = true;
      });

    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(publicationCompleted).toBe(false);

    finishHandler?.();
    await publication;

    expect(publicationCompleted).toBe(true);
  });

  it('reports subscriber failures once and resolves', async () => {
    const eventType = 'domain:test:failed-publication';
    const failure = new Error('subscriber failed');
    eventBus.subscribe(eventType, async () => {
      throw failure;
    });

    await expect(
      eventBus.publish(
        eventValue.make({ type: eventType, data: { id: 'test' } })
      )
    ).resolves.toBeUndefined();
    expect(reporter.report).toHaveBeenCalledWith(
      'event.publication.failed',
      failure,
      { eventTypes: [eventType] }
    );
  });

  it('reports invalid published event types and resolves', async () => {
    const invalidEvent = eventValue.make({
      type: 'app:test:invalid-publication',
      data: { id: 'test' },
    });

    await expect(eventBus.publish(invalidEvent)).resolves.toBeUndefined();
    expect(reporter.report).toHaveBeenCalledWith(
      'event.publication.failed',
      expect.any(Error),
      { eventTypes: [invalidEvent.type] }
    );
  });

  it('reports invalid subscriptions and returns a safe unsubscribe', () => {
    const unsubscribe = eventBus.subscribe(
      'app:test:invalid-subscription',
      async () => undefined
    );

    expect(reporter.report).toHaveBeenCalledTimes(1);
    expect(reporter.report).toHaveBeenCalledWith(
      'event.subscription.failed',
      expect.any(Error),
      { eventType: 'app:test:invalid-subscription' }
    );
    expect(unsubscribe()).toBeUndefined();
  });

  it('allows a subscriber to unsubscribe', async () => {
    const eventType = 'domain:test:unsubscribe';
    const handler = jest.fn(async () => undefined);
    const unsubscribe = eventBus.subscribe(eventType, handler);
    unsubscribe();

    await eventBus.publish(
      eventValue.make({ type: eventType, data: { id: 'test' } })
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('publishes an event array', async () => {
    const firstType = 'domain:test:array-first';
    const secondType = 'domain:test:array-second';
    const firstHandler = jest.fn(async () => undefined);
    const secondHandler = jest.fn(async () => undefined);
    eventBus.subscribe(firstType, firstHandler);
    eventBus.subscribe(secondType, secondHandler);

    await eventBus.publish([
      eventValue.make({ type: firstType, data: { id: 'first' } }),
      eventValue.make({ type: secondType, data: { id: 'second' } }),
    ]);

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).toHaveBeenCalledTimes(1);
  });
});
