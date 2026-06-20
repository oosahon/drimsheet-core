import IReporter from '../../../shared/contracts/reporter.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../dtos/ledger-account-balance-adjustment.dto';
import ledgerUseCases from '../usecases';

export default function makeLedgerAccountBalanceAdjustmentWorker(
  reporter: IReporter
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    try {
      await ledgerUseCases.adjustLedgerAccountBalance(payload);
    } catch (error) {
      reporter.report(error);
      throw error;
    }
  };
}
