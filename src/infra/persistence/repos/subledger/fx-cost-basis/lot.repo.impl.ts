import { and, asc, eq } from 'drizzle-orm';

import IFxCostBasisLotRepo from '@domain/subledger/fx-cost-basis/repos/lot.repo';
import { EFxCostBasisLotStatus } from '@domain/subledger/fx-cost-basis/types/lot.types';

import {
  subledgerFxCostBasisLotHistoryInAudit,
  subledgerFxCostBasisLotsInCore,
} from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import fxCostBasisLotHistoryMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/lot-history.mapper';
import fxCostBasisLotMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/lot.mapper';

const fxCostBasisLotRepo: IFxCostBasisLotRepo = {
  findOpenByAccountId: async (accountingEntityId, ledgerAccountId, options) => {
    const results = await getDbQuery(options)
      .select()
      .from(subledgerFxCostBasisLotsInCore)
      .where(
        and(
          eq(
            subledgerFxCostBasisLotsInCore.accountingEntityId,
            accountingEntityId
          ),
          eq(subledgerFxCostBasisLotsInCore.ledgerAccountId, ledgerAccountId),
          eq(subledgerFxCostBasisLotsInCore.status, EFxCostBasisLotStatus.Open)
        )
      )
      .orderBy(
        asc(subledgerFxCostBasisLotsInCore.acquisitionDate),
        asc(subledgerFxCostBasisLotsInCore.createdAt),
        asc(subledgerFxCostBasisLotsInCore.id)
      );
    return results.map(fxCostBasisLotMapper.toDomain);
  },

  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      const repoModel = fxCostBasisLotMapper.toRepo(payload);
      await tx.insert(subledgerFxCostBasisLotsInCore).values(repoModel);

      const historyValues = Array.isArray(options.history)
        ? options.history
        : [options.history];
      await tx
        .insert(subledgerFxCostBasisLotHistoryInAudit)
        .values(historyValues.map(fxCostBasisLotHistoryMapper.toRepo));
    });
  },

  update: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      const repoModel = fxCostBasisLotMapper.toRepo(payload);
      await tx
        .update(subledgerFxCostBasisLotsInCore)
        .set(repoModel)
        .where(eq(subledgerFxCostBasisLotsInCore.id, payload.id));

      const historyValues = Array.isArray(options.history)
        ? options.history
        : [options.history];
      await tx
        .insert(subledgerFxCostBasisLotHistoryInAudit)
        .values(historyValues.map(fxCostBasisLotHistoryMapper.toRepo));
    });
  },
};

export default fxCostBasisLotRepo;
