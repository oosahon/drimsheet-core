import journalEntryHistoryMapper from '../../../../app/journal-entry/mappers/journal-entry-history.mapper';
import IJournalEntryHistoryRepo from '../../../../domain/journal-entry/repos/journal-entry-history.repo';
import { journalEntryHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const journalEntryHistoryRepo: IJournalEntryHistoryRepo = {
  create: async (header, history, options) => {
    const headersArray = Array.isArray(header) ? header : [header];
    const historiesArray = Array.isArray(history) ? history : [history];

    const values = headersArray.map((h, i) =>
      journalEntryHistoryMapper.toRepo(h, historiesArray[i])
    );

    await getDbQuery(options).insert(journalEntryHistoryInAudit).values(values);
  },
};

export default journalEntryHistoryRepo;
