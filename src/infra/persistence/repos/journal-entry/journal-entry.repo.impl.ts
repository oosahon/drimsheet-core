import { eq } from 'drizzle-orm';
import journalEntryMapper from '../../../../app/journal-entry/mappers/journal-entry.mapper';
import IJournalEntryRepo from '../../../../domain/journal-entry/repos/journal-entry.repo';
import { journalEntriesInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const journalEntryRepo: IJournalEntryRepo = {
  create: async (payload, options) => {
    const entriesArray = Array.isArray(payload) ? payload : [payload];

    const entries = entriesArray.map(journalEntryMapper.toRepo);

    const dbQuery = getDbQuery(options);

    await dbQuery.insert(journalEntriesInCore).values(entries);
  },

  async findById(id, options) {
    const response = await getDbQuery(
      options
    ).query.journalEntriesInCore.findFirst({
      where: eq(journalEntriesInCore.id, id),
      with: {
        journalLinesInCores: true,
      },
    });

    return response ? journalEntryMapper.toDomain(response) : null;
  },
};

export default journalEntryRepo;
