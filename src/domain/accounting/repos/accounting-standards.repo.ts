import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IAccountingStandard } from '@domain/accounting/types/accounting-standards.types';

export interface IAccountingStandardRepo {
  create(
    accountingStandard: IAccountingStandard | IAccountingStandard[],
    repoOptions: IWriteRepoOptions
  ): Promise<void>;
}
