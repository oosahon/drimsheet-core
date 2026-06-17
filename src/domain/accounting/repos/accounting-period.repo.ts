import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingPeriodHistory } from '../types/period-audit.types';
import { IAccountingPeriod } from '../types/period.types';

export default interface IAccountingPeriodRepo {
  create(
    payload: IAccountingPeriod | IAccountingPeriod[],
    options: IWriteRepoOptions<
      IAccountingPeriodHistory | IAccountingPeriodHistory[]
    >
  ): Promise<void>;
}
