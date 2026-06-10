import makeJournalEntryService from '../../../domain/journal-entry/services/journal-entry.service';
import ledgerRepos from '../../persistence/repos/ledger';

const journalEntryService = makeJournalEntryService(
  ledgerRepos.ledgerAccount,
  ledgerRepos.ledgerAccountBalance
);

const journalEntryDomainServices = Object.freeze({
  journalEntry: journalEntryService,
});

export default journalEntryDomainServices;
