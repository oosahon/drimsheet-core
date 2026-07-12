import IReporter from '../../../shared/contracts/reporter.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../dtos/ledger-account-balance-adjustment.dto';
import ledgerUseCases from '../usecases';

interface IDependencies {
  reporter: IReporter;
}

export default function makeLedgerAccountBalanceAdjustmentWorker(
  deps: IDependencies
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    try {
      await ledgerUseCases.adjustLedgerAccountBalance(payload);
    } catch (error) {
      deps.reporter.report(error);
      throw error;
    }
  };
}
