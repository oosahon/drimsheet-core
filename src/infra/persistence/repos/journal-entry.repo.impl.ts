import { eq } from 'drizzle-orm';
import journalEntryMapper, {
  IJournalEntryModel,
} from '../../../app/mappers/journal-entry.mapper';
import journalLineMapper, {
  IJournalLineModel,
} from '../../../app/mappers/journal-line.mapper';
import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import {
  journalEntriesInCore,
  journalLinesInCore,
} from '../../config/drizzle/schema';
import getDbQuery from './helpers/query';

const journalEntryRepo: IJournalEntryRepo = {
  save: async (payload, options) => {
    const entriesArray = Array.isArray(payload) ? payload : [payload];

    const entries: IJournalEntryModel[] = [];
    const lines: IJournalLineModel[] = [];

    for (const entry of entriesArray) {
      entries.push(journalEntryMapper.toRepo(entry));
      lines.push(...entry.lines.map((l) => journalLineMapper.toRepo(l)));
    }

    const dbQuery = getDbQuery(options);

    await dbQuery.transaction(async (tx) => {
      await tx.insert(journalEntriesInCore).values(entries);
      await tx.insert(journalLinesInCore).values(lines);
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
