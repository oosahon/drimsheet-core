import { eq, sql } from 'drizzle-orm';
import journalEntryMapper, {
  IJournalEntryModel,
} from '../../../../app/journal-entry/mappers/journal-entry.mapper';
import IJournalEntryRepo from '../../../../domain/journal-entry/repos/journal-entry.repo';
import { journalEntriesInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const journalEntryRepo: IJournalEntryRepo = {
  save: async (payload, options) => {
    const entriesArray = Array.isArray(payload) ? payload : [payload];

    const entries: IJournalEntryModel[] = entriesArray.map(
      journalEntryMapper.toRepo
    );

    const dbQuery = getDbQuery(options);

    await dbQuery
      .insert(journalEntriesInCore)
      .values(entries)
      .onConflictDoUpdate({
        target: journalEntriesInCore.id,
        set: {
          accountingEntityId: sql`excluded.accounting_entity_id`,
          sourceType: sql`excluded.source_type`,
          counterpartyId: sql`excluded.counterparty_id`,
          memo: sql`excluded.memo`,
          status: sql`excluded.status`,
          effectiveDate: sql`excluded.effective_date`,
          postedAt: sql`excluded.posted_at`,
          voidedAt: sql`excluded.voided_at`,
          voidingEntryId: sql`excluded.voiding_entry_id`,
          version: sql`excluded.version`,
          createdBy: sql`excluded.created_by`,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`excluded.updated_at`,
        },
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
