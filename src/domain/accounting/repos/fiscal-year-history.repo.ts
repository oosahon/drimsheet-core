import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IFiscalYear } from '@domain/accounting/types/fiscal-year.types';
import { IFiscalYearHistory } from '@domain/accounting/types/period-audit.types';

export default interface IFiscalYearHistoryRepo {
  save(
    fiscalYear: IFiscalYear,
    history: IFiscalYearHistory,
    options: IWriteRepoOptions
  ): Promise<void>;
}
