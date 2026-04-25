import eventBus from './event-bus';
import queues from './jobs/queues';

const messaging = {
  eventBus,
  queues,
};

export default messaging;
