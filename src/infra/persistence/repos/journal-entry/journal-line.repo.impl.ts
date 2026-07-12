import { and, eq, ilike, sql } from 'drizzle-orm';
import IJournalLineRepo from '../../../../domain/journal-entry/repos/journal-line.repo';
import paginationValue from '../../../../shared/value-objects/pagination.vo';
import { journalLinesInCore } from '../../../config/drizzle/schema';
import journalLineMapper from '../../mappers/journal-entry/journal-line.mapper';
import drizzleFilters from '../helpers/filters';
import passOnRepoTransaction from '../helpers/passon-repo-transaction';
import getDbQuery from '../helpers/query';
import journalLineHistoryRepo from './journal-line-history.repo.impl';

const journalLineRepo: IJournalLineRepo = {
  create: async (payload, options) => {
    const lines = Array.isArray(payload) ? payload : [payload];

    await getDbQuery(options).transaction(async (tx) => {
      const mappedLines = lines.map(journalLineMapper.toRepo);
      await tx.insert(journalLinesInCore).values(mappedLines);

      await journalLineHistoryRepo.create(
        lines,
        options.history,
        options.accountingEntityId,
        passOnRepoTransaction(options, tx)
      );
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
