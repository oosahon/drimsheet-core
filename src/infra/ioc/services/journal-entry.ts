import makeJournalEntryPersistenceService from '../../../app/journal-entry/services/journal-entry-persistence.service';
import makeOpeningBalanceEntryService from '../../../app/journal-entry/services/opening-balance-entry.service';
import journalEntryRepos from '../../persistence/repos/journal-entry';
import ledgerRepos from '../../persistence/repos/ledger';
import repoService from './repo';

const openingBalanceEntry = makeOpeningBalanceEntryService({
  ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

const journalEntryPersistence = makeJournalEntryPersistenceService({
  repoService,
  journalEntryRepo: journalEntryRepos.journalEntry,
  journalLineRepo: journalEntryRepos.journalLine,
});

const journalEntryServices = Object.freeze({
  openingBalanceEntry,
  journalEntryPersistence,
});

export default journalEntryServices;
