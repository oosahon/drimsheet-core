import { InferSelectModel } from 'drizzle-orm';
import { IUserHistory } from '../../../../domain/user/types/user-audit.types';
import { userProfileHistoryInAudit } from '../../../config/drizzle/schema';
import { toRepoDate } from '../shared/date';

export interface IUserProfileHistory extends InferSelectModel<
  typeof userProfileHistoryInAudit
> {}

const userHistoryMapper = {
  toRepo(
    history: IUserHistory
  ): Omit<IUserProfileHistory, 'id' | 'recordedAt'> {
    return {
      userProfileId: history.entityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default userHistoryMapper;
