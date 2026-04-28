import { IRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingPeriod } from '../types/period.types';

export default interface IAccountingPeriodRepo {
  save(
    payload: IAccountingPeriod | IAccountingPeriod[],
    options: IRepoOptions
  ): Promise<void>;
}
