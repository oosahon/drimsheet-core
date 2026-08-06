import { and, eq, ilike, inArray, sql } from 'drizzle-orm';
import ICounterpartyRepo, {
  ECounterpartySortBy,
} from '../../../../domain/counterparty/repos/counterparty.repo';
import { UCounterpartyRole } from '../../../../domain/counterparty/types/counterparty.types';
import drizzleFilters from '../../../../shared/helpers/drizzle-filters';
import passOnRepoTransaction from '../../../../shared/helpers/passon-repo-transaction';
import paginationValue from '../../../../shared/values/pagination/pagination.vo';
import {
  counterpartiesInCore,
  counterpartyRolesInCore,
} from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import counterpartyHistoryRepo from './counterparty-history.repo.impl';
import counterpartyRoleMapper from './mappers/counterparty-role.mapper';
import counterpartyMapper from './mappers/counterparty.mapper';

const counterpartyRepo: ICounterpartyRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      await tx
        .insert(counterpartiesInCore)
        .values(counterpartyMapper.toRepo(payload));

      await counterpartyHistoryRepo.save(
        payload,
        options.history,
        passOnRepoTransaction(options, tx)
      );

      if (payload.roles?.length) {
        await tx
          .insert(counterpartyRolesInCore)
          .values(counterpartyRoleMapper.toRepoMany(payload.id, payload.roles));
      }
    });
  },

  findAll: async (accountingEntityId, options) => {
    const conditions = [
      eq(counterpartiesInCore.accountingEntityId, accountingEntityId),
    ];

    if (options.type) {
      conditions.push(eq(counterpartiesInCore.type, options.type));
    }

    if (options.status) {
      conditions.push(eq(counterpartiesInCore.status, options.status));
    }

    if (options.search) {
      conditions.push(ilike(counterpartiesInCore.name, `%${options.search}%`));
    }

    const dbQuery = getDbQuery(options);

    if (options.roles && options.roles.length > 0) {
      const subquery = dbQuery
        .select({ counterpartyId: counterpartyRolesInCore.counterpartyId })
        .from(counterpartyRolesInCore)
        .where(inArray(counterpartyRolesInCore.role, options.roles));
      conditions.push(inArray(counterpartiesInCore.id, subquery));
    }

    const whereClause = and(...conditions);

    const [countResult] = await dbQuery
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(counterpartiesInCore)
      .where(whereClause);

    const totalCount = countResult?.count ?? 0;

    if (totalCount === 0) {
      return paginationValue.getPaginatedResponse([], 0, options);
    }

    const direction = drizzleFilters.getSortDirection(
      paginationValue.getSortDirection(options.sortDirection)
    );

    const orderByClause = [];
    if (options.orderBy === ECounterpartySortBy.Name) {
      orderByClause.push(direction(counterpartiesInCore.name));
    } else {
      orderByClause.push(direction(counterpartiesInCore.createdAt));
    }
    orderByClause.push(direction(counterpartiesInCore.id));

    const limit = paginationValue.getLimit(options.limit);
    const offset = paginationValue.getOffset(options.offset);

    const results = await dbQuery
      .select()
      .from(counterpartiesInCore)
      .where(whereClause)
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    const counterpartyIds = results.map((r) => r.id);

    const roles = await dbQuery
      .select()
      .from(counterpartyRolesInCore)
      .where(inArray(counterpartyRolesInCore.counterpartyId, counterpartyIds));

    const rolesMap = roles.reduce(
      (acc, row) => {
        if (!acc[row.counterpartyId]) {
          acc[row.counterpartyId] = [];
        }
        acc[row.counterpartyId].push(row.role as UCounterpartyRole);
        return acc;
      },
      {} as Record<string, UCounterpartyRole[]>
    );

    const counterparties = results.map((row) =>
      counterpartyMapper.toDomain(row, rolesMap[row.id] || [])
    );

    return paginationValue.getPaginatedResponse(
      counterparties,
      totalCount,
      options
    );
  },

  async findById(id, accountingEntityId, options) {
    const dbQuery = getDbQuery(options);

    const [result] = await dbQuery
      .select()
      .from(counterpartiesInCore)
      .where(
        and(
          eq(counterpartiesInCore.id, id),
          eq(counterpartiesInCore.accountingEntityId, accountingEntityId)
        )
      )
      .limit(1);

    if (!result) {
      return null;
    }

    const roles = await dbQuery
      .select()
      .from(counterpartyRolesInCore)
      .where(eq(counterpartyRolesInCore.counterpartyId, result.id));

    return counterpartyMapper.toDomain(
      result,
      roles.map((role) => role.role as UCounterpartyRole)
    );
  },
};

export default counterpartyRepo;
