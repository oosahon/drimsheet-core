import journalEntryMapper, {
  IJournalEntryModel,
  IJournalLineModel,
} from '../../../app/mappers/journal-entry.mapper';
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
      entries.push(journalEntryMapper.toRepoEntry(entry));
      lines.push(...entry.lines.map((l) => journalEntryMapper.toRepoLine(l)));
    }

    const dbQuery = getDbQuery(options);

    await dbQuery.transaction(async (tx) => {
      await tx.insert(journalEntriesInCore).values(entries);
      await tx.insert(journalLinesInCore).values(lines);
    });
  },
};

export default journalEntryRepo;
