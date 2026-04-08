import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { IUserActivity } from '../types/user-activity.types';

export default interface IUserActivityRepo {
  save(activity: IUserActivity, options: IRepoOptions): Promise<void>;
}
