import makeJournalEntryPersistenceService from '../../../app/journal-entry/services/journal-entry-persistence.service';
import makeOpeningBalanceEntryService from '../../../domain/journal-entry/services/opening-balance-entry.service';
import journalEntryRepos from '../../persistence/repos/journal-entry';
import ledgerRepos from '../../persistence/repos/ledger';
import { repoService } from './repo';

export const openingBalanceEntryService = makeOpeningBalanceEntryService({
  ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

export const journalEntryPersistenceService =
  makeJournalEntryPersistenceService({
    repoService,
    journalEntryRepo: journalEntryRepos.journalEntry,
    journalLineRepo: journalEntryRepos.journalLine,
  });
