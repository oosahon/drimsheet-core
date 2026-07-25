import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getLedgerAccountBalanceAdjustmentQueue } from '../messaging/queues/ledger-account-balance.queue';
import { getTransactionalEmailQueue } from '../messaging/queues/transactional-email.queue';

export default function createBullMqServerAdapter(): ExpressAdapter {
  const bullMqServerAdapter = new ExpressAdapter();

  bullMqServerAdapter.setBasePath('/bullmq-board-admin');

  createBullBoard({
    queues: [
      new BullMQAdapter(getTransactionalEmailQueue()),
      new BullMQAdapter(getLedgerAccountBalanceAdjustmentQueue()),
    ],
    serverAdapter: bullMqServerAdapter,
  });

  return bullMqServerAdapter;
}
