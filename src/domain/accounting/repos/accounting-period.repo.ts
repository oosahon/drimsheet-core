import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IAccountingPeriodHistory } from '@domain/accounting/types/period-audit.types';
import { IAccountingPeriod } from '@domain/accounting/types/period.types';

export default interface IAccountingPeriodRepo {
  findByDate(
    accountingEntityId: TEntityId,
    date: Date,
    options: IReadRepoOptions
  ): Promise<IAccountingPeriod | null>;

  create(
    payload: IAccountingPeriod | IAccountingPeriod[],
    options: IWriteRepoOptions<
      IAccountingPeriodHistory | IAccountingPeriodHistory[]
    >
  ): Promise<void>;
}
