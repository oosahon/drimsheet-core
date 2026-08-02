import makeJournalEntryPersistenceService from '../../../app/journal-entry/services/journal-entry-persistence.service';
import makeJournalEntryService from '../../../domain/journal-entry/services/journal-entry.service';
import journalEntryRepos from '../../persistence/repos/journal-entry';
import ledgerRepos from '../../persistence/repos/ledger';
import { repoService } from './repo';

export const journalEntryService = makeJournalEntryService({
  ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

export const journalEntryPersistenceService =
  makeJournalEntryPersistenceService({
    repoService,
    journalEntryRepo: journalEntryRepos.journalEntry,
    journalLineRepo: journalEntryRepos.journalLine,
  });
