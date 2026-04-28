import { InferSelectModel } from 'drizzle-orm';
import { IAccountingEntity } from '../../domain/accounting/types/accounting-entity.types';
import { accountingEntitiesInCore } from '../../infra/config/drizzle/schema';
import { TEntityId } from '../../shared/types/uuid';
import { IAccountingEntityRes } from '../contracts/dto/accounting-entity.dto';

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
