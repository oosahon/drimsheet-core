import makeLedgerAccountBalanceAdjustmentWorker from '@app/ledger/workers/ledger-account-balance-adjustment.worker';

import { adjustLedgerAccountBalanceUseCase } from '@infra/ioc/usecases/ledger';
import observability from '@infra/observability';

export const ledgerAccountBalanceAdjustmentWorker =
  makeLedgerAccountBalanceAdjustmentWorker({
    reporter: observability.reporter,
    adjustLedgerAccountBalance: adjustLedgerAccountBalanceUseCase,
  });
