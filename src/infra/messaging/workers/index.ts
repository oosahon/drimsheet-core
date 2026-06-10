import { ILedgerAccountBalanceAdjustmentDto } from '../../../app/ledger/dtos/ledger-account-balance-adjustment.dto';
import ledgerWorkers from '../../../app/ledger/workers';
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
    ledgerWorkers.ledgerAccountBalanceAdjustment
  );
}

export default workerRegistration;
