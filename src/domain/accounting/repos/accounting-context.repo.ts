import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingContext } from '../types/context.types';

export default interface IAccountingContextRepo {
  save(payload: IAccountingContext, options: IWriteRepoOptions): Promise<void>;
}
