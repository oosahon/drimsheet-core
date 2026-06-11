import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import {
  IAccountingEntity,
  UAccountingEntityType,
} from '../types/accounting-entity.types';

export default interface IAccountingEntityRepo {
  save(domain: IAccountingEntity, options: IWriteRepoOptions): Promise<void>;

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
