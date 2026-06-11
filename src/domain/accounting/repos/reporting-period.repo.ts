import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IReportingPeriod } from '../types/period.types';

export default interface IReportingPeriodRepo {
  save(
    payload: IReportingPeriod | IReportingPeriod[],
    options: IWriteRepoOptions
  ): Promise<void>;
}
