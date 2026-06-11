import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IFiscalYear } from '../types/fiscal-year.types';

export default interface IFiscalYearRepo {
  save(payload: IFiscalYear, options: IWriteRepoOptions): Promise<void>;
}
