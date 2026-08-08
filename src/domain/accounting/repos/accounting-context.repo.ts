import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IAccountingContextHistory } from '@domain/accounting/types/accounting-context-audit.types';
import { IAccountingContext } from '@domain/accounting/types/context.types';

export default interface IAccountingContextRepo {
  create(
    payload: IAccountingContext,
    options: IWriteRepoOptions<IAccountingContextHistory>
  ): Promise<void>;
}
