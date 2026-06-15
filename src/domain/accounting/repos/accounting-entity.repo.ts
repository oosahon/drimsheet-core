import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IAccountingEntityAuditHistory } from '../types/accounting-entity-audit.types';
import {
  IAccountingEntity,
  UAccountingEntityType,
} from '../types/accounting-entity.types';

export default interface IAccountingEntityRepo {
  create(
    domain: IAccountingEntity,
    options: IWriteRepoOptions<IAccountingEntityAuditHistory>
  ): Promise<void>;

  findById(
    id: TEntityId,
    options: IReadRepoOptions
  ): Promise<IAccountingEntity | null>;

  findByUserId(
    userId: TEntityId,
    options: IReadRepoOptions,
    type?: UAccountingEntityType
  ): Promise<IAccountingEntity[]>;
}
