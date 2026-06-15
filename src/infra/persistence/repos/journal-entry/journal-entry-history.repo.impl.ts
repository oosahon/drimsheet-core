import journalEntryHistoryMapper from '../../../../app/journal-entry/mappers/journal-entry-history.mapper';
import IJournalEntryHistoryRepo from '../../../../domain/journal-entry/repos/journal-entry-history.repo';
import { journalEntryHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const journalEntryHistoryRepo: IJournalEntryHistoryRepo = {
  create: async (header, history, options) => {
    await getDbQuery(options)
      .insert(journalEntryHistoryInAudit)
      .values(journalEntryHistoryMapper.toRepo(header, history));
  },
};

export default journalEntryHistoryRepo;
