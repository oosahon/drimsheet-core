import { EventEmitter } from 'node:events';

import IEventBus from '@shared/contracts/event-bus.contract';
import eventError from '@shared/values/events/event.error';

import reporter from '@infra/observability/reporter';

const emitter = new EventEmitter();

const validateEventType = (eventType: string) => {
  const isValid = eventType.startsWith('domain:');
  if (!isValid) {
    throw new eventError.InvalidType({ eventType });
  }
};

const eventBus: IEventBus = {
  // TODO: check if publishing really needs async
  publish: async (event) => {
    const eventTypes = (Array.isArray(event) ? event : [event]).map(
      ({ type }) => type
    );

    try {
      const eventsArray = Array.isArray(event) ? event : [event];
      for (const event of eventsArray) {
        validateEventType(event.type);
        await Promise.all(
          emitter.listeners(event.type).map((handler) => handler(event))
        );
      }
      // TODO add redis pub/sub
    } catch (error) {
      reporter.report('event.publication.failed', error, { eventTypes });
    }
  },

  subscribe(eventType, handler) {
    try {
      validateEventType(eventType);
      emitter.on(eventType, handler);
      return () => emitter.off(eventType, handler);
      // TODO add redis pub/sub
    } catch (error) {
      reporter.report('event.subscription.failed', error, { eventType });
      return () => undefined;
    }
  },
};

export default eventBus;
