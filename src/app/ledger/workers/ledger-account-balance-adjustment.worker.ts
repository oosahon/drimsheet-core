import IReporter from '../../../shared/contracts/reporter.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';

interface IDependencies {
  reporter: IReporter;
  adjustLedgerAccountBalance: (
    payload: ILedgerAccountBalanceAdjustmentDto
  ) => Promise<void>;
}

export default function makeLedgerAccountBalanceAdjustmentWorker(
  deps: IDependencies
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    try {
      await deps.adjustLedgerAccountBalance(payload);
    } catch (error) {
      deps.reporter.report(error);
      throw error;
    }
  };
}
