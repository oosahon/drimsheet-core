import { EventEmitter } from 'node:events';
import IEventBus from '../../app/contracts/infra/event-bus.contract';
import { AppError } from '../../shared/value-objects/error';
import reporter from '../observability/reporter';

const emitter = new EventEmitter();

const validateEventType = (eventType: string) => {
  const isValid = eventType.startsWith('domain:');
  if (!isValid) {
    throw new AppError('Invalid event type', { cause: eventType });
  }
};

const eventBus: IEventBus = {
  publish: async (event) => {
    try {
      validateEventType(event.type);

      if (event.type.startsWith('domain:')) {
        emitter.emit(event.type, event);
      }
      // TODO add redis pub/sub
    } catch (error) {
      reporter.report(error);
    }
  },

  subscribe(eventType, handler) {
    try {
      validateEventType(eventType);
      emitter.on(eventType, handler);
      return () => emitter.off(eventType, handler);
      // TODO add redis pub/sub
    } catch (error) {
      reporter.report(error);
    }
  },
};

export default eventBus;
