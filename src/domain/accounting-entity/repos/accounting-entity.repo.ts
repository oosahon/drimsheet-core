import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityId } from '../../../shared/types/uuid';
import {
  IAccountingEntity,
  UAccountingEntityType,
} from '../types/accounting-entity.types';

export default interface IAccountingEntityRepo {
  save(domain: IAccountingEntity, options: IRepoOptions): Promise<void>;

  findById(
    id: TEntityId,
    options: IRepoOptions
  ): Promise<IAccountingEntity | null>;

  findByUserId(
    userId: TEntityId,
    options: IRepoOptions,
    type?: UAccountingEntityType
  ): Promise<IAccountingEntity[]>;
}
