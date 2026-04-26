import { ILedgerAccountBalanceAdjustmentDto } from '../../contracts/dto/workers.dto';
import ILogger from '../../contracts/infra/logger.contract';
import accountingUsecases from '../../usecases/accounting';

export default function makeLedgerAccountBalanceAdjustmentWorker(
  logger: ILogger
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    try {
      await accountingUsecases.adjustLedgerAccountBalance(payload);
    } catch (error) {
      logger.error('Failed to adjust ledger account balance', error);
      throw error;
    }
  };
}
