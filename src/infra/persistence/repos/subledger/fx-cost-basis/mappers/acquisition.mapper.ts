import { InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import { IFxCostBasisLotAcquisition } from '@domain/subledger/fx-cost-basis/types/acquisition.types';

import { subledgerFxCostBasisLotAcquisitionsInCore } from '@infra/config/drizzle/schema';
import {
  fromRepoDate,
  toRepoDate,
  toRepoDateOnly,
} from '@infra/persistence/helpers/date.mapper';
import moneyMapper from '@infra/persistence/helpers/money.mapper';
import exchangeRateMapper, {
  IExchangeRateModel,
} from '@infra/persistence/repos/money/mappers/exchange-rate.mapper';

export interface IFxCostBasisLotAcquisitionModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotAcquisitionsInCore
> {}

const fxCostBasisLotAcquisitionMapper = {
  toDomain(
    payload: IFxCostBasisLotAcquisitionModel
  ): IFxCostBasisLotAcquisition {
    return {
      createdBy: payload.createdBy as TEntityId,
      id: payload.id as TEntityId,
      ledgerAccountId: payload.ledgerAccountId as TEntityId,
      accountingEntityId: payload.accountingEntityId as TEntityId,
      lotId: payload.lotId as TEntityId,
      journalEntryId: payload.journalEntryId as TEntityId,
      quantity: moneyMapper.fromRepo(
        payload.quantityAmount,
        payload.quantityCurrency
      ),
      costBasis: moneyMapper.fromRepo(
        payload.costBasisAmount,
        payload.costBasisCurrency
      ),
      acquisitionRate: exchangeRateMapper.toDomain(
        payload.acquisitionRate as IExchangeRateModel
      ),
      acquisitionDate: fromRepoDate(payload.acquisitionDate),
      officialRate: payload.officialRate
        ? exchangeRateMapper.toDomain(
            payload.officialRate as IExchangeRateModel
          )
        : null,
      createdAt: fromRepoDate(payload.createdAt),
    };
  },

  toRepo(payload: IFxCostBasisLotAcquisition): IFxCostBasisLotAcquisitionModel {
    return {
      createdBy: payload.createdBy as TEntityId,
      id: payload.id,
      ledgerAccountId: payload.ledgerAccountId,
      accountingEntityId: payload.accountingEntityId,
      lotId: payload.lotId,
      journalEntryId: payload.journalEntryId,
      quantityAmount: moneyMapper.toRepo(payload.quantity).amount,
      quantityCurrency: payload.quantity.currency.code,
      costBasisAmount: moneyMapper.toRepo(payload.costBasis).amount,
      costBasisCurrency: payload.costBasis.currency.code,
      acquisitionRate: payload.acquisitionRate,
      acquisitionDate: toRepoDateOnly(payload.acquisitionDate),
      officialRate: payload.officialRate
        ? exchangeRateMapper.toEmbedded(payload.officialRate)
        : null,
      createdAt: toRepoDate(payload.createdAt),
    };
  },
};

export default fxCostBasisLotAcquisitionMapper;
