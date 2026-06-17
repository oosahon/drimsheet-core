import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IReportingPeriodHistory } from '../types/period-audit.types';
import { IReportingPeriod } from '../types/period.types';

export default interface IReportingPeriodRepo {
  create(
    payload: IReportingPeriod | IReportingPeriod[],
    options: IWriteRepoOptions<
      IReportingPeriodHistory | IReportingPeriodHistory[]
    >
  ): Promise<void>;
}
