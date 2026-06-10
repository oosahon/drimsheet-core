import observability from '../../../infra/observability';
import makeLedgerAccountBalanceAdjustmentWorker from './ledger-account-balance-adjustment.worker';

const bookkeepingWorkers = {
  ledgerAccountBalanceAdjustment: makeLedgerAccountBalanceAdjustmentWorker(
    observability.logger
  ),
};

export default bookkeepingWorkers;
