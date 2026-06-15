import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingContextHistory } from '../types/accounting-context-audit.types';
import { IAccountingContext } from '../types/context.types';

export default interface IAccountingContextHistoryRepo {
  save(
    context: IAccountingContext,
    history: IAccountingContextHistory,
    options: IWriteRepoOptions
  ): Promise<void>;
}
