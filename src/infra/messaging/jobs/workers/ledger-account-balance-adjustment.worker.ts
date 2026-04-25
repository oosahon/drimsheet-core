import { Job, Worker } from 'bullmq';
import { ILedgerAccountBalanceAdjustmentPayload } from '../../../../app/contracts/infra/queues.contract';
import ledgerAccountBalanceMapper from '../../../../app/mappers/ledger-account-balance.mapper';
import { queueConnection } from '../../../config/redis.config';
import reporter from '../../../observability/reporter';
import repos from '../../../persistence/repos';

export default function ledgerAccountBalanceAdjustmentWorker() {
  return new Worker(
    'ledger-account-balance-adjustment',
    async (job: Job<ILedgerAccountBalanceAdjustmentPayload>) => {
      try {
        const { correlationId, ...payload } = job.data;

        const parsedPayload =
          ledgerAccountBalanceMapper.fromRepoNewBalanceAndAdjustment(payload);

        await repos.ledgerAccountBalance.adjustBalance(parsedPayload, {
          correlationId,
          expectedVersion: parsedPayload.newBalance.version,
        });
      } catch (error) {
        reporter.report(error, { job });
        throw error;
      }
    },
    {
      connection: queueConnection,
    }
  );
}
