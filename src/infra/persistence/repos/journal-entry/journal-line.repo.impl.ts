import { and, eq, ilike, sql } from 'drizzle-orm';
import journalLineMapper from '../../../../app/journal-entry/mappers/journal-line.mapper';
import IJournalLineRepo from '../../../../domain/journal-entry/repos/journal-line.repo';
import paginationValue from '../../../../shared/value-objects/pagination.vo';
import { journalLinesInCore } from '../../../config/drizzle/schema';
import drizzleFilters from '../helpers/filters';
import getDbQuery from '../helpers/query';

const journalLineRepo: IJournalLineRepo = {
  save: async (payload, options) => {
    const lines = (Array.isArray(payload) ? payload : [payload]).map(
      journalLineMapper.toRepo
    );
    const dbQuery = getDbQuery(options);

    await dbQuery
      .insert(journalLinesInCore)
      .values(lines)
      .onConflictDoUpdate({
        target: journalLinesInCore.id,
        set: {
          entryId: sql`excluded.entry_id`,
          accountId: sql`excluded.account_id`,
          sequenceOrder: sql`excluded.sequence_order`,
          amount: sql`excluded.amount`,
          currencyCode: sql`excluded.currency_code`,
          exchangeRate: sql`excluded.exchange_rate`,
          functionalAmount: sql`excluded.functional_amount`,
          functionalCurrencyCode: sql`excluded.functional_currency_code`,
          side: sql`excluded.side`,
          description: sql`excluded.description`,
          meta: sql`excluded.meta`,
          version: sql`excluded.version`,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  },

  findAllByAccountId: async (accountId, options) => {
    const conditions = [eq(journalLinesInCore.accountId, accountId)];

    if (options.search) {
      conditions.push(
        ilike(journalLinesInCore.description, `%${options.search}%`)
      );
    }

    const whereClause = and(...conditions);
    const dbQuery = getDbQuery(options);

    const [countResult] = await dbQuery
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(journalLinesInCore)
      .where(whereClause);

    const totalCount = countResult?.count ?? 0;

    if (totalCount === 0) {
      return paginationValue.getPaginatedResponse([], 0, options);
    }

    const direction = drizzleFilters.getSortDirection(
      paginationValue.getSortDirection(options.sortDirection)
    );

    let orderByClause;
    if (options.orderBy === 'amount') {
      orderByClause = direction(journalLinesInCore.amount);
    } else if (options.orderBy === 'sequenceOrder') {
      orderByClause = direction(journalLinesInCore.sequenceOrder);
    } else {
      orderByClause = direction(journalLinesInCore.createdAt);
    }

    const limit = paginationValue.getLimit(options.limit);
    const offset = paginationValue.getOffset(options.offset);

    const result = await dbQuery
      .select()
      .from(journalLinesInCore)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return paginationValue.getPaginatedResponse(
      result.map(journalLineMapper.toDomain),
      totalCount,
      options
    );
  },
};

export default journalLineRepo;
