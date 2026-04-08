import { InferSelectModel } from 'drizzle-orm';
import { IUserActivity } from '../../domain/user/types/user-activity.types';
import { userActivitiesInAudit } from '../../infra/persistence/drizzle/schema';
import { toCommonRepoDates, toRepoDate } from './date';

interface IUserActivityModel extends InferSelectModel<
  typeof userActivitiesInAudit
> {}

const userActivityMapper = {
  toRepo(activity: IUserActivity): IUserActivityModel {
    return {
      id: activity.id,
      userId: activity.userId,
      eventKey: activity.eventKey,
      description: activity.description,
      meta: activity.meta,
      createdAt: toRepoDate(activity.createdAt),
    };
  },
};

export default userActivityMapper;
