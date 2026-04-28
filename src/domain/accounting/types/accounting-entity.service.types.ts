import { TEntityId } from '../../../shared/types/uuid';
import { IAccountingEntity } from './accounting-entity.types';

export default interface IAccountingEntityService {
  grantUserAccess(
    accountingEntity: IAccountingEntity,
    userId: TEntityId
  ): boolean;

  validateAccess(accountingEntity: IAccountingEntity, userId: TEntityId): void;
}
