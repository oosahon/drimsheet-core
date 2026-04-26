import {
  ILedgerAccountBalanceAdjustmentDto,
  ITransactionalEmailDto,
} from '../../../app/contracts/dto/workers.dto';
import { EQueueName } from '../../../app/contracts/infra/queues.contract';
import IReporter from '../../../app/contracts/infra/reporter.contract';
import workers from '../../../app/handlers/queue/index';
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
