import {
  ILedgerAccountBalanceAdjustmentDto,
  ITransactionalEmailDto,
} from '../../../app/contracts/dto/workers.dto';
import IReporter from '../../../app/contracts/infra/reporter.contract';
import workers from '../../../app/handlers/queue/index';
import { registerBullMQWorker } from '../../config/bullmq.config';

function workerRegistrationV2(reporter: IReporter) {
  try {
    registerBullMQWorker<ITransactionalEmailDto>(
      'transactional-email',
      workers.transactionalEmail
    );

    registerBullMQWorker<ILedgerAccountBalanceAdjustmentDto>(
      'ledger-account-balance-adjustment',
      workers.ledgerAccountBalanceAdjustment
    );
  } catch (error) {
    reporter.report(error, { context: 'Failed to register workers' });
  }
}

export default workerRegistrationV2;
