import { EventEmitter } from 'node:events';

import IEventBus from '@shared/contracts/event-bus.contract';
import eventError from '@shared/values/events/event.error';
import type { TEventHandler } from '@shared/values/events/types/event.types';

import reporter from '@infra/integrations/sentry/sentry-reporter';

const emitter = new EventEmitter();

const validateEventType = (eventType: string) => {
  const isValid = eventType.startsWith('domain:');
  if (!isValid) {
    throw new eventError.InvalidType({ eventType });
  }
};

const eventBus: IEventBus = {
  publish: async (event) => {
    const eventTypes = (Array.isArray(event) ? event : [event]).map(
      ({ type }) => type
    );

    try {
      const eventsArray = Array.isArray(event) ? event : [event];
      for (const event of eventsArray) {
        validateEventType(event.type);
        const handlers = emitter.listeners(
          event.type
        ) as TEventHandler<unknown>[];

        await Promise.all(handlers.map((handler) => handler(event)));
      }
    } catch (error) {
      reporter.report('event.publication.failed', error, { eventTypes });
    }
  },

  subscribe(eventType, handler) {
    try {
      validateEventType(eventType);
      emitter.on(eventType, handler);
      return () => emitter.off(eventType, handler);
    } catch (error) {
      reporter.report('event.subscription.failed', error, { eventType });
      return () => undefined;
    }
  },
};

export default eventBus;
