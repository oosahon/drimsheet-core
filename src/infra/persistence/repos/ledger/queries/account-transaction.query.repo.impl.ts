import { and, eq, ilike, sql } from 'drizzle-orm';
import IAccountTransactionQueryRepo from '../../../../../app/ledger/contracts/account-transaction.query.repo.contract';
import paginationValue from '../../../../../shared/value-objects/pagination.vo';
import {
  journalEntriesInCore,
  journalLinesInCore,
} from '../../../../config/drizzle/schema';
import accountTransactionMapper from '../../../mappers/ledger/account-transaction.mapper';
import drizzleFilters from '../../helpers/filters';
import getDbQuery from '../../helpers/query';

const accountTransactionQueryRepo: IAccountTransactionQueryRepo = {
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
      .innerJoin(
        journalEntriesInCore,
        eq(journalLinesInCore.entryId, journalEntriesInCore.id)
      )
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
    } else if (options.orderBy === 'effectiveDate') {
      orderByClause = direction(journalEntriesInCore.effectiveDate);
    } else {
      orderByClause = direction(journalLinesInCore.createdAt);
    }

    const limit = paginationValue.getLimit(options.limit);
    const offset = paginationValue.getOffset(options.offset);

    const result = await dbQuery
      .select({
        line: journalLinesInCore,
        header: journalEntriesInCore,
      })
      .from(journalLinesInCore)
      .innerJoin(
        journalEntriesInCore,
        eq(journalLinesInCore.entryId, journalEntriesInCore.id)
      )
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return paginationValue.getPaginatedResponse(
      result.map(accountTransactionMapper.toDomain),
      totalCount,
      options
    );
  },
};

export default accountTransactionQueryRepo;
