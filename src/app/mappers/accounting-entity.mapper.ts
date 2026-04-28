import { InferSelectModel } from 'drizzle-orm';
import { IAccountingEntity } from '../../domain/accounting/types/accounting-entity.types';
import { UCurrencyCode } from '../../domain/currency/config/currencies.config';
import { accountingEntitiesInCore } from '../../infra/config/drizzle/schema';
import { TEntityId } from '../../shared/types/uuid';
export type IAccountingEntityRes = any; // TODO: define in dto

export interface IAccountingEntityModel extends InferSelectModel<
  typeof accountingEntitiesInCore
> {}

const accountingEntityMapper = {
  toRepo(entity: IAccountingEntity): IAccountingEntityModel {
    return {
      id: entity.id,
      ownerId: entity.ownerId,
      name: entity.name,
      type: entity.type,
      functionalCurrencyCode: entity.functionalCurrencyCode,
      jurisdictionCode: entity.jurisdictionCode,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  },

  toDomain(payload: IAccountingEntityModel): IAccountingEntity {
    return Object.freeze({
      id: payload.id as TEntityId,
      ownerId: payload.ownerId as TEntityId,
      name: payload.name,
      type: payload.type,
      functionalCurrencyCode: payload.functionalCurrencyCode as UCurrencyCode,
      jurisdictionCode: payload.jurisdictionCode as any,
      createdAt: new Date(payload.createdAt),
      updatedAt: new Date(payload.updatedAt),
    });
  },

  toInterface(payload: IAccountingEntity): IAccountingEntityRes {
    return {
      ...payload,
    };
  },
};

export default accountingEntityMapper;
