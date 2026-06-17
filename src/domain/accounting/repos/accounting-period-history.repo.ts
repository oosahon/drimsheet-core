import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingPeriodHistory } from '../types/period-audit.types';
import { IAccountingPeriod } from '../types/period.types';

export default interface IAccountingPeriodHistoryRepo {
  save(
    periods: IAccountingPeriod | IAccountingPeriod[],
    histories: IAccountingPeriodHistory | IAccountingPeriodHistory[],
    options: IWriteRepoOptions
  ): Promise<void>;
}
