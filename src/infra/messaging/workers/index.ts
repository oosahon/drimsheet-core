import { ILedgerAccountBalanceAdjustmentDto } from '../../../app/bookkeeping/dtos/ledger-account-balance-adjustment.dto';
import bookkeepingWorkers from '../../../app/bookkeeping/workers';
import { ITransactionalEmailDto } from '../../../app/notification/dtos/transactional-email.dto';
import notificationWorkers from '../../../app/notification/workers';
import { EQueueName } from '../../../app/shared/contracts/queues.contract';
import IReporter from '../../../app/shared/contracts/reporter.contract';
import { registerBullMQWorker } from '../../config/bullmq.config';
import internalMailer from '../../config/internal-mailer.config';
import { NODE_ENV } from '../../config/vars.config';
import zeptoMail from '../../config/zeptomail.config';
import observability from '../../observability';

const mailer = NODE_ENV === 'test' ? internalMailer : zeptoMail.notifications;

function workerRegistration(reporter: IReporter) {
  try {
    registerBullMQWorker<ITransactionalEmailDto>(
      EQueueName.TransactionalEmail,
      notificationWorkers.makeTransactionalEmailWorker(mailer)
    );

    registerBullMQWorker<ILedgerAccountBalanceAdjustmentDto>(
      EQueueName.LedgerAccountBalanceAdjustment,
      bookkeepingWorkers.makeLedgerAccountBalanceAdjustmentWorker(
        observability.logger
      )
    );
  } catch (error) {
    reporter.report(error, { context: 'Failed to register workers' });
  }
}

export default workerRegistration;
