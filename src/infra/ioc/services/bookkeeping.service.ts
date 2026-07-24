import makeJournalEntryPersistenceService from '../../../app/bookkeeping/services/journal-entry-persistence.service';
import makeLedgerAccountBalancePropagationService from '../../../app/bookkeeping/services/ledger-account-balance-propagation.service';
import makeOpeningBalanceEntryService from '../../../app/bookkeeping/services/opening-balance-entry.service';
import makeTransactionEntryService from '../../../app/bookkeeping/services/transaction-entry.service';
import messaging from '../../messaging';
import journalEntryRepos from '../../persistence/repos/journal-entry';
import ledgerRepos from '../../persistence/repos/ledger';
import repoService from './repo.service';

const transactionEntry = makeTransactionEntryService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

const openingBalanceEntry = makeOpeningBalanceEntryService({
  ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

const balancePropagation = makeLedgerAccountBalancePropagationService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
});

const journalEntryPersistence = makeJournalEntryPersistenceService({
  repoService,
  journalEntryRepo: journalEntryRepos.journalEntry,
  journalLineRepo: journalEntryRepos.journalLine,
});

const bookkeepingServices = Object.freeze({
  transactionEntry,
  openingBalanceEntry,
  balancePropagation,
  journalEntryPersistence,
});

export default bookkeepingServices;
