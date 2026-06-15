import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingContextHistory } from '../types/accounting-context-audit.types';
import { IAccountingContext } from '../types/context.types';

export default interface IAccountingContextRepo {
  create(
    payload: IAccountingContext,
    options: IWriteRepoOptions<IAccountingContextHistory>
  ): Promise<void>;
}
