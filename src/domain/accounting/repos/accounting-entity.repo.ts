import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { IAccountingEntity } from '../types/accounting.types';

export default interface IAccountingEntityRepo {
  save(domain: IAccountingEntity, options: IRepoOptions): Promise<void>;
}
