import messaging from '../../../infra/messaging';
import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import makeAdjustBalanceAfterJournalEntryUseCase from './adjust-balance-after-journal-entry.usecase';
import makeCreateLedgerAccountBalanceUseCase from './create-ledger-account-balance.usecase';

const accountingUsecases = {
  createLedgerAccountBalance: makeCreateLedgerAccountBalanceUseCase(
    appContext.request,
    repos.ledgerAccountBalance
  ),

  adjustBalanceAfterJournalEntry: makeAdjustBalanceAfterJournalEntryUseCase(
    appContext.request,
    repos.ledgerAccount,
    repos.ledgerAccountBalance,
    messaging.eventBus
  ),
};

export default accountingUsecases;
