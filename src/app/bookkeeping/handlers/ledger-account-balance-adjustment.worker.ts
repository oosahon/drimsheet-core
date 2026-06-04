import bookkeepingUseCases from '../../bookkeeping/usecases';
import ILogger from '../../shared/contracts/logger.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../../shared/dtos/workers.dto';

export default function makeLedgerAccountBalanceAdjustmentWorker(
  logger: ILogger
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    try {
      await bookkeepingUseCases.adjustLedgerAccountBalance(payload);
    } catch (error) {
      logger.error('Failed to adjust ledger account balance', error);
      throw error;
    }
  };
}
