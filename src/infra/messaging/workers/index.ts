import { LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME } from '../../../app/ledger/contracts/ledger-balance-adjustment-queue.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../../../app/ledger/dtos/ledger-account-balance-adjustment.dto';
import ledgerWorkers from '../../../app/ledger/workers';
import { TRANSACTIONAL_EMAIL_QUEUE_NAME } from '../../../app/notification/contracts/transactional-email-queue.contract';
import { ITransactionalEmailDto } from '../../../app/notification/dtos/transactional-email.dto';
import notificationWorkers from '../../../app/notification/workers';
import { registerBullMQWorker } from '../../config/bullmq.config';

function workerRegistration() {
  registerBullMQWorker<ITransactionalEmailDto>(
    TRANSACTIONAL_EMAIL_QUEUE_NAME,
    notificationWorkers.transactionalEmail
  );

  registerBullMQWorker<ILedgerAccountBalanceAdjustmentDto>(
    LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
    ledgerWorkers.ledgerAccountBalanceAdjustment
  );
}

export default workerRegistration;
