import makeJournalEntryPersistenceService from '../../../domain/journal-entry/services/journal-entry-persistence.service';
import makeJournalEntryService from '../../../domain/journal-entry/services/journal-entry.service';
import journalEntryRepos from '../../persistence/repos/journal-entry';
import ledgerRepos from '../../persistence/repos/ledger';
import repoService from '../repo.service';

const journalEntryService = makeJournalEntryService(
  ledgerRepos.ledgerAccount,
  ledgerRepos.ledgerAccountBalance
);
const journalEntryPersistenceService = makeJournalEntryPersistenceService(
  journalEntryRepos,
  repoService
);

const journalEntryDomainServices = Object.freeze({
  journalEntry: journalEntryService,
  journalEntryPersistence: journalEntryPersistenceService,
});

export default journalEntryDomainServices;
