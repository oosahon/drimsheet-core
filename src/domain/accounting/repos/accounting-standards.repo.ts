import { IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IAccountingStandard } from '@domain/accounting/types/accounting-standards.types';

export interface IAccountingStandardRepo {
  create(
    accountingStandard: IAccountingStandard | IAccountingStandard[],
    createdBy: TEntityId,
    repoOptions: IWriteRepoOptions
  ): Promise<void>;
}
