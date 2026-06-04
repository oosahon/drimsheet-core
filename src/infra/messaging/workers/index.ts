import { EQueueName } from '../../../app/shared/contracts/queues.contract';
import IReporter from '../../../app/shared/contracts/reporter.contract';
import {
  ILedgerAccountBalanceAdjustmentDto,
  ITransactionalEmailDto,
} from '../../../app/shared/dtos/workers.dto';
import workers from '../../../app/shared/handlers/queue-workers.index';
import { registerBullMQWorker } from '../../config/bullmq.config';

function workerRegistration(reporter: IReporter) {
  try {
    registerBullMQWorker<ITransactionalEmailDto>(
      EQueueName.TransactionalEmail,
      workers.transactionalEmail
    );

    registerBullMQWorker<ILedgerAccountBalanceAdjustmentDto>(
      EQueueName.LedgerAccountBalanceAdjustment,
      workers.ledgerAccountBalanceAdjustment
    );
  } catch (error) {
    reporter.report(error, { context: 'Failed to register workers' });
  }
}

export default workerRegistration;
