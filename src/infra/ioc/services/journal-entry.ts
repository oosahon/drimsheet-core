import makeJournalEntryService from '@domain/journal-entry/services/journal-entry.service';

import makeJournalEntryPersistenceService from '@app/journal-entry/services/journal-entry-persistence.service';

import journalEntryRepos from '@infra/persistence/repos/journal-entry';
import ledgerRepos from '@infra/persistence/repos/ledger';

import { accountingPeriodService } from './accounting';
import { repoService } from './repo';

export const journalEntryService = makeJournalEntryService({
  accountingPeriodService,
  ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

export const journalEntryPersistenceService =
  makeJournalEntryPersistenceService({
    repoService,
    journalEntryAttachmentRepo: journalEntryRepos.journalEntryAttachment,
    journalEntryRepo: journalEntryRepos.journalEntry,
    journalLineRepo: journalEntryRepos.journalLine,
  });
