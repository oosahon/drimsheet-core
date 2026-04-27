import { ILedgerAccountBalanceAdjustmentDto } from '../../contracts/dto/workers.dto';
import ILogger from '../../contracts/infra/logger.contract';
import bookkeepingUseCases from '../../usecases/bookkeeping';

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
