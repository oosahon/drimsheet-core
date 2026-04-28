import { IRepoOptions } from '../../../shared/types/repo.types';
import { IReportingContext } from '../types/context.types';

export default interface IReportingContextRepo {
  save(payload: IReportingContext, options: IRepoOptions): Promise<void>;
}
