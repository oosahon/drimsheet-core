import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IReportingContext } from '@domain/accounting/types/context.types';
import { IReportingContextHistory } from '@domain/accounting/types/reporting-context-audit.types';

export default interface IReportingContextHistoryRepo {
  save(
    context: IReportingContext,
    history: IReportingContextHistory,
    options: IWriteRepoOptions
  ): Promise<void>;
}
