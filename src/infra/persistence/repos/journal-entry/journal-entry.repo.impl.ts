import { and, eq, ilike, inArray, sql } from 'drizzle-orm';

import drizzleFilters from '@shared/helpers/drizzle-filters';
import passOnRepoTransaction from '@shared/helpers/passon-repo-transaction';
import paginationValue from '@shared/values/pagination/pagination.vo';

import IJournalEntryRepo, {
  EJournalEntrySortBy,
} from '@domain/journal-entry/repos/journal-entry.repo';

import {
  journalEntriesInCore,
  journalLinesInCore,
} from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import journalEntryMapper from '@infra/persistence/repos/journal-entry/mappers/journal-entry.mapper';

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
        journalEntryAttachmentsInCores: true,
        journalLinesInCores: true,
      },
    });

    return response ? journalEntryMapper.toDomain(response) : null;
  },

  async findAll(accountingEntityId, options) {
    const dbQuery = getDbQuery(options);
    const conditions = [
      eq(journalEntriesInCore.accountingEntityId, accountingEntityId),
    ];

    if (options.accountId) {
      const participatingEntryIds = dbQuery
        .select({ entryId: journalLinesInCore.entryId })
        .from(journalLinesInCore)
        .where(eq(journalLinesInCore.accountId, options.accountId));

      conditions.push(inArray(journalEntriesInCore.id, participatingEntryIds));
    }

    if (options.search) {
      conditions.push(ilike(journalEntriesInCore.memo, `%${options.search}%`));
    }

    const whereClause = and(...conditions);
    const [countResult] = await dbQuery
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(journalEntriesInCore)
      .where(whereClause);
    const totalCount = countResult?.count ?? 0;

    if (totalCount === 0) {
      return paginationValue.getPaginatedResponse([], 0, options);
    }

    const direction = drizzleFilters.getSortDirection(
      paginationValue.getSortDirection(options.sortDirection)
    );
    const orderByColumn =
      options.orderBy === EJournalEntrySortBy.EffectiveDate
        ? journalEntriesInCore.effectiveDate
        : journalEntriesInCore.createdAt;
    const limit = paginationValue.getLimit(options.limit);
    const offset = paginationValue.getOffset(options.offset);

    const entries = await dbQuery.query.journalEntriesInCore.findMany({
      where: whereClause,
      with: {
        journalEntryAttachmentsInCores: true,
        journalLinesInCores: true,
      },
      orderBy: [direction(orderByColumn), direction(journalEntriesInCore.id)],
      limit,
      offset,
    });

    return paginationValue.getPaginatedResponse(
      entries.map(journalEntryMapper.toDomain),
      totalCount,
      options
    );
  },
};

export default journalEntryRepo;
