import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import makeAdjustBalanceAfterJournalEntryUseCase from './adjust-balance-after-journal-entry.usecase';
import makeCreateLedgerAccountBalanceUseCase from './create-ledger-account-balance.usecase';

const accountingUsecases = {
  createLedgerAccountBalance: makeCreateLedgerAccountBalanceUseCase(
    appContext.request,
    repos.ledgerAccountBalance,
    repos.ledgerAccount,
    observability.logger
  ),

  adjustBalanceAfterJournalEntry: makeAdjustBalanceAfterJournalEntryUseCase(
    appContext.request,
    repos.ledgerAccount,
    repos.ledgerAccountBalance,
    messaging.queues
  ),
};

export default accountingUsecases;
