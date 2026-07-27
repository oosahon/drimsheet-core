import makeJournalEntryPersistenceService from '../../../app/bookkeeping/services/journal-entry-persistence.service';
import makeLedgerAccountBalancePropagationService from '../../../app/bookkeeping/services/ledger-account-balance-propagation.service';
import makeOpeningBalanceEntryService from '../../../app/bookkeeping/services/opening-balance-entry.service';
import messaging from '../../messaging';
import observability from '../../observability';
import journalEntryRepos from '../../persistence/repos/journal-entry';
import ledgerRepos from '../../persistence/repos/ledger';
import repoService from './repo';

const openingBalanceEntry = makeOpeningBalanceEntryService({
  ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

const balancePropagation = makeLedgerAccountBalancePropagationService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
  reporter: observability.reporter,
});

const journalEntryPersistence = makeJournalEntryPersistenceService({
  repoService,
  journalEntryRepo: journalEntryRepos.journalEntry,
  journalLineRepo: journalEntryRepos.journalLine,
});

const bookkeepingServices = Object.freeze({
  openingBalanceEntry,
  balancePropagation,
  journalEntryPersistence,
});

export default bookkeepingServices;
