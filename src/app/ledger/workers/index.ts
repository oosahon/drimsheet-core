import observability from '../../../infra/observability';
import makeLedgerAccountBalanceAdjustmentWorker from './ledger-account-balance-adjustment.worker';

const ledgerWorkers = {
  ledgerAccountBalanceAdjustment: makeLedgerAccountBalanceAdjustmentWorker({
    reporter: observability.reporter,
  }),
};

export default ledgerWorkers;
