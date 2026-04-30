import { IRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingStandard } from '../types/accounting-standards.types';

export interface IAccountingStandardRepo {
  save(
    accountingStandard: IAccountingStandard | IAccountingStandard[],
    repoOptions: IRepoOptions
  ): Promise<void>;
}
