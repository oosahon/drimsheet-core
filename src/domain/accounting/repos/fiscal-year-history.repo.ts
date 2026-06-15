import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IFiscalYear } from '../types/fiscal-year.types';
import { IFiscalYearHistory } from '../types/period-audit.types';

export default interface IFiscalYearHistoryRepo {
  save(
    fiscalYear: IFiscalYear,
    history: IFiscalYearHistory,
    options: IWriteRepoOptions
  ): Promise<void>;
}
