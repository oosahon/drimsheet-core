import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IUserActivity } from '../types/user-activity.types';

export default interface IUserActivityRepo {
  save(activity: IUserActivity, options: IWriteRepoOptions): Promise<void>;
}
