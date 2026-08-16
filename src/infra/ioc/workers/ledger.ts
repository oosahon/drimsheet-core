import makeLedgerAccountBalanceAdjustmentWorker from '@app/ledger/workers/ledger-account-balance-adjustment.worker';

import { adjustLedgerAccountBalanceUseCase } from '@infra/ioc/usecases/ledger';

export const ledgerAccountBalanceAdjustmentWorker =
  makeLedgerAccountBalanceAdjustmentWorker({
    usecase: adjustLedgerAccountBalanceUseCase,
  });
