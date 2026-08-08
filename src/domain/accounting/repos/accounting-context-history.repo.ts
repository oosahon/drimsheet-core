import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IAccountingContextHistory } from '@domain/accounting/types/accounting-context-audit.types';
import { IAccountingContext } from '@domain/accounting/types/context.types';

export default interface IAccountingContextHistoryRepo {
  save(
    context: IAccountingContext,
    history: IAccountingContextHistory,
    options: IWriteRepoOptions
  ): Promise<void>;
}
