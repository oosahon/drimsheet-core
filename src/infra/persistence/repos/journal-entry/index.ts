import journalEntryQueryRepo from '@infra/persistence/repos/journal-entry/queries/journal-entry.query.repo.impl';

import journalEntryAttachmentRepo from './journal-entry-attachment.repo.impl';
import journalEntryHistoryRepo from './journal-entry-history.repo.impl';
import journalEntryRepo from './journal-entry.repo.impl';
import journalLineHistoryRepo from './journal-line-history.repo.impl';
import journalLineRepo from './journal-line.repo.impl';

const journalEntryRepos = {
  journalEntryAttachment: journalEntryAttachmentRepo,
  journalEntryHistory: journalEntryHistoryRepo,
  journalEntry: journalEntryRepo,
  journalLineHistory: journalLineHistoryRepo,
  journalLine: journalLineRepo,

  queries: {
    journalEntry: journalEntryQueryRepo,
  },
};

export default journalEntryRepos;
