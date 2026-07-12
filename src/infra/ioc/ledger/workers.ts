import makeLedgerAccountBalanceAdjustmentWorker from '../../../app/ledger/workers/ledger-account-balance-adjustment.worker';
import observability from '../../observability';
import ledgerUseCases from './usecases';

const ledgerWorkers = {
  ledgerAccountBalanceAdjustment: makeLedgerAccountBalanceAdjustmentWorker({
    reporter: observability.reporter,
    adjustLedgerAccountBalance: ledgerUseCases.adjustLedgerAccountBalance,
  }),
};

export default ledgerWorkers;
