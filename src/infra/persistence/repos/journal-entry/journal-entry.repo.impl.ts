import { eq } from 'drizzle-orm';
import IJournalEntryRepo from '../../../../domain/journal-entry/repos/journal-entry.repo';
import { journalEntriesInCore } from '../../../config/drizzle/schema';
import journalEntryMapper from '../../mappers/journal-entry/journal-entry.mapper';
import passOnRepoTransaction from '../helpers/passon-repo-transaction';
import getDbQuery from '../helpers/query';
import journalEntryHistoryRepo from './journal-entry-history.repo.impl';

const journalEntryRepo: IJournalEntryRepo = {
  create: async (payload, options) => {
    const entriesArray = Array.isArray(payload) ? payload : [payload];
    const historiesArray = Array.isArray(options.history)
      ? options.history
      : [options.history];

    await getDbQuery(options).transaction(async (tx) => {
      const entries = entriesArray.map(journalEntryMapper.toRepo);
      await tx.insert(journalEntriesInCore).values(entries);

      await journalEntryHistoryRepo.create(
        entriesArray,
        historiesArray,
        passOnRepoTransaction(options, tx)
      );
    });
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
