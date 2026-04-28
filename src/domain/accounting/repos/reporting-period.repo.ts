import { IRepoOptions } from '../../../shared/types/repo.types';
import { IReportingPeriod } from '../types/period.types';

export default interface IReportingPeriodRepo {
  save(
    payload: IReportingPeriod | IReportingPeriod[],
    options: IRepoOptions
  ): Promise<void>;
}
