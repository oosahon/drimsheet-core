import { eq } from 'drizzle-orm';
import journalEntryMapper from '../../../../app/journal-entry/mappers/journal-entry.mapper';
import IJournalEntryRepo from '../../../../domain/journal-entry/repos/journal-entry.repo';
import { journalEntriesInCore } from '../../../config/drizzle/schema';
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

      for (let i = 0; i < entriesArray.length; i++) {
        await journalEntryHistoryRepo.create(
          entriesArray[i],
          historiesArray[i],
          passOnRepoTransaction(options, tx)
        );
      }
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
