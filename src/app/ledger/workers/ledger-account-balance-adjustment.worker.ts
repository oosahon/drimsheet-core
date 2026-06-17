import ILogger from '../../../shared/contracts/logger.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../dtos/ledger-account-balance-adjustment.dto';
import ledgerUseCases from '../usecases';

export default function makeLedgerAccountBalanceAdjustmentWorker(
  logger: ILogger
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    try {
      await ledgerUseCases.adjustLedgerAccountBalance(payload);
    } catch (error) {
      logger.error('Failed to adjust ledger account balance', error);
      throw error;
    }
  };
}
