import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IReportingContext } from '../types/context.types';
import { IReportingContextHistory } from '../types/reporting-context-audit.types';

export default interface IReportingContextHistoryRepo {
  save(
    context: IReportingContext,
    history: IReportingContextHistory,
    options: IWriteRepoOptions
  ): Promise<void>;
}
