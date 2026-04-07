import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { transactionalEmailQueue } from '../messaging/jobs/queues';

const bullMqServerAdapter = new ExpressAdapter();

bullMqServerAdapter.setBasePath('/bullmq-board-admin');

createBullBoard({
  queues: [new BullMQAdapter(transactionalEmailQueue)],
  serverAdapter: bullMqServerAdapter,
});

export default bullMqServerAdapter;
