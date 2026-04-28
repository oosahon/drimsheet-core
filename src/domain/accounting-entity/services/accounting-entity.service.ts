import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { ErrorConflict } from '../../../shared/value-objects/error';
import accountingEntityEntity from '../entities/accounting-entity.entity';
import IAccountingEntityRepo from '../repos/accounting-entity.repo';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../types/accounting-entity.types';

export interface IAccountingEntityService {
  make: (
    userId: TEntityId,
    payload: TCreationOmits<IAccountingEntity>,
    repoOptions: IRepoOptions
  ) => Promise<TEntityWithEvents<IAccountingEntity, IAccountingEntity>>;
}

export default function makeAccountingEntityService(
  repo: IAccountingEntityRepo
): IAccountingEntityService {
  return {
    async make(
      userId: TEntityId,
      payload: TCreationOmits<IAccountingEntity>,
      repoOptions: IRepoOptions
    ) {
      const existingEntities = await repo.findByUserId(
        userId,
        repoOptions,
        payload.type
      );

      const isDuplicateIndividual =
        payload.type === EAccountingEntityType.Individual &&
        existingEntities.length > 0;

      if (isDuplicateIndividual) {
        throw new ErrorConflict('User already has an accounting entity');
      }

      return accountingEntityEntity.make(payload);
    },
  };
}
