import userActivityMapper from '../../../app/user/mappers/user-activity.mapper';
import IUserActivityRepo from '../../../domain/user/repos/user-activity.repo';
import { userActivitiesInAudit } from '../../config/drizzle/schema';
import getDbQuery from './helpers/query';

const userActivityRepo: IUserActivityRepo = {
  async save(activity, options) {
    const query = getDbQuery(options);

    await query
      .insert(userActivitiesInAudit)
      .values(userActivityMapper.toRepo(activity));
  },
};

export default userActivityRepo;
