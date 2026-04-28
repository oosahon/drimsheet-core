import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IAccountingEntity } from './accounting-entity.types';

export default interface IAccountingEntityService {
  create(
    userId: TEntityId,
    payload: TCreationOmits<IAccountingEntity>,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IAccountingEntity, IAccountingEntity>>;

  grantUserAccess(
    accountingEntity: IAccountingEntity,
    userId: TEntityId
  ): boolean;

  validateAccess(accountingEntity: IAccountingEntity, userId: TEntityId): void;
}
