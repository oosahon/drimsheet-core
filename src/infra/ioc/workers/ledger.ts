import makeLedgerAccountBalanceAdjustmentWorker from '../../../app/ledger/workers/ledger-account-balance-adjustment.worker';
import observability from '../../observability';
import { adjustLedgerAccountBalanceUseCase } from '../usecases/ledger';

export const ledgerAccountBalanceAdjustmentWorker =
  makeLedgerAccountBalanceAdjustmentWorker({
    reporter: observability.reporter,
    adjustLedgerAccountBalance: adjustLedgerAccountBalanceUseCase,
  });
