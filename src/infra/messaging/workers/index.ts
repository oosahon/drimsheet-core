import { LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME } from '@app/ledger/contracts/ledger-balance-adjustment-queue.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '@app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';
import { TRANSACTIONAL_EMAIL_QUEUE_NAME } from '@app/notification/contracts/transactional-email-queue.contract';
import { ITransactionalEmailDto } from '@app/notification/dtos/transactional-email/transactional-email.dto';

import { registerBullMQWorker } from '@infra/config/bullmq.config';
import { ledgerAccountBalanceAdjustmentWorker } from '@infra/ioc/workers/ledger';
import { transactionalEmailWorker } from '@infra/ioc/workers/notification';

function workerRegistration() {
  registerBullMQWorker<ITransactionalEmailDto>(
    TRANSACTIONAL_EMAIL_QUEUE_NAME,
    transactionalEmailWorker
  );

  registerBullMQWorker<ILedgerAccountBalanceAdjustmentDto>(
    LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
    ledgerAccountBalanceAdjustmentWorker
  );
}

export default workerRegistration;
