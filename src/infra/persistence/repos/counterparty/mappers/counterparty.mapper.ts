import { InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import {
  ICounterparty,
  UCounterpartyRole,
  UCounterpartyStatus,
  UCounterpartyType,
} from '@domain/counterparty/types/counterparty.types';

import { counterpartiesInCore } from '@infra/config/drizzle/schema';
import {
  fromRepoDate,
  toRepoDate,
} from '@infra/persistence/helpers/date.mapper';

export interface ICounterpartyModel extends InferSelectModel<
  typeof counterpartiesInCore
> {}

const counterpartyMapper = {
  toRepo(entity: ICounterparty): ICounterpartyModel {
    return {
      id: entity.id,
      accountingEntityId: entity.accountingEntityId,
      name: entity.name,
      status: entity.status,
      type: entity.type,
      createdAt: toRepoDate(entity.createdAt),
      updatedAt: toRepoDate(entity.updatedAt),
    };
  },

  toDomain(
    payload: ICounterpartyModel,
    roles: UCounterpartyRole[] = []
  ): ICounterparty {
    return Object.freeze({
      id: payload.id as TEntityId,
      accountingEntityId: payload.accountingEntityId as TEntityId,
      name: payload.name,
      status: payload.status as UCounterpartyStatus,
      type: payload.type as UCounterpartyType,
      roles: [...roles],
      createdAt: fromRepoDate(payload.createdAt),
      updatedAt: fromRepoDate(payload.updatedAt),
    });
  },
};

export default counterpartyMapper;
