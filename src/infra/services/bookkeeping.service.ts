import services from '.';
import makeJournalEntryPersistenceService from '../../app/bookkeeping/services/journal-entry-persistence.service';
import makeLedgerAccountBalancePropagationService from '../../app/bookkeeping/services/ledger-account-balance-propagation.service';
import makeOpeningBalanceEntryService from '../../app/bookkeeping/services/opening-balance-entry.service';
import makeTransferTransactionEntryService from '../../app/bookkeeping/services/transaction-entry.service';
import messaging from '../messaging';
import journalEntryRepos from '../persistence/repos/journal-entry';
import ledgerRepos from '../persistence/repos/ledger';

const transactionEntry = makeTransferTransactionEntryService(
  ledgerRepos.ledgerAccount
);

const openingBalanceEntry = makeOpeningBalanceEntryService(
  ledgerRepos.ledgerAccountBalance,
  ledgerRepos.ledgerAccount
);

const balancePropagation = makeLedgerAccountBalancePropagationService(
  ledgerRepos.ledgerAccount,
  messaging.queues.ledgerBalanceAdjustment
);

const journalEntryPersistence = makeJournalEntryPersistenceService(
  services.repo,
  journalEntryRepos.journalEntry,
  journalEntryRepos.journalLine,
  balancePropagation
);

const bookkeepingServices = Object.freeze({
  transactionEntry,
  openingBalanceEntry,
  balancePropagation,
  journalEntryPersistence,
});

export default bookkeepingServices;
