import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IAccountingPeriod } from './period.types';

export default interface IAccountingPeriodService {
  validatePostingPeriod(
    accountingEntityId: TEntityId,
    postingDate: Date,
    repoOptions: IReadRepoOptions
  ): Promise<IAccountingPeriod>;
}
