import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IReportingContext } from '../types/context.types';
import { IReportingContextHistory } from '../types/reporting-context-audit.types';

export default interface IReportingContextRepo {
  create(
    payload: IReportingContext,
    options: IWriteRepoOptions<IReportingContextHistory>
  ): Promise<void>;
}
