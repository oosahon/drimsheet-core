import { IRepoOptions } from '../../../shared/types/repo.types';
import { IUserActivity } from '../types/user-activity.types';

export default interface IUserActivityRepo {
  save(activity: IUserActivity, options: IRepoOptions): Promise<void>;
}
