import { InferSelectModel } from 'drizzle-orm';

import { IUserHistory } from '@domain/user/types/user-audit.types';

import { userProfileHistoryInAudit } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

export interface IUserProfileHistory extends InferSelectModel<
  typeof userProfileHistoryInAudit
> {}

const userHistoryMapper = {
  toRepo(
    history: IUserHistory
  ): Omit<IUserProfileHistory, 'id' | 'recordedAt'> {
    return {
      userProfileId: history.entityId,
      action: history.action,
      actorId: history.actorId,
      onBehalfOf: history.onBehalfOf,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default userHistoryMapper;
