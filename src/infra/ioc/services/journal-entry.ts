import makeJournalEntryPersistenceService from '../../../app/journal-entry/services/journal-entry-persistence.service';
import makeJournalEntryService from '../../../domain/journal-entry/services/journal-entry.service';
import makeOpeningBalanceEntryService from '../../../domain/journal-entry/services/opening-balance-entry.service';
import counterpartyRepos from '../../persistence/repos/counterparty';
import journalEntryRepos from '../../persistence/repos/journal-entry';
import ledgerRepos from '../../persistence/repos/ledger';
import { accountingPeriodService } from './accounting';
import { repoService } from './repo';

export const journalEntryService = makeJournalEntryService({
  accountingPeriodService,
  counterpartyRepo: counterpartyRepos.counterparty,
});

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
