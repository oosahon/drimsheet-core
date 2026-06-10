import { ILedgerAccountBalanceAdjustmentDto } from '../../../app/bookkeeping/dtos/ledger-account-balance-adjustment.dto';
import bookkeepingWorkers from '../../../app/bookkeeping/workers';
import { ITransactionalEmailDto } from '../../../app/notification/dtos/transactional-email.dto';
import notificationWorkers from '../../../app/notification/workers';
import { EQueueName } from '../../../app/shared/contracts/queues.contract';
import { registerBullMQWorker } from '../../config/bullmq.config';

function workerRegistration() {
  registerBullMQWorker<ITransactionalEmailDto>(
    EQueueName.TransactionalEmail,
    notificationWorkers.transactionalEmail
  );

  registerBullMQWorker<ILedgerAccountBalanceAdjustmentDto>(
    EQueueName.LedgerAccountBalanceAdjustment,
    bookkeepingWorkers.ledgerAccountBalanceAdjustment
  );
}

export default workerRegistration;
