import eventBus from '@infra/messaging/bus/event-bus';

import queues from './queues';

const messaging = {
  eventBus,
  queues,
};

export default messaging;
