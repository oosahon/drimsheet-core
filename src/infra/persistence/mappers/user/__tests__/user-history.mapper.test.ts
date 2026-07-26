import { IUserHistory } from '../../../../../domain/user/types/user-audit.types';
import { EHistoryActorType } from '../../../../../shared/history/types/history.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { toRepoDate } from '../../shared/date';
import userHistoryMapper from '../user-history.mapper';

describe('userHistoryMapper', () => {
  it('maps user history to the repository model', () => {
    const userProfileId = 'user-profile-uuid' as TEntityId;
    const userId = 'user-uuid' as TEntityId;
    const occurredAt = new Date('2026-07-25T12:00:00.000Z');

    const history: IUserHistory = {
      entityId: userProfileId,
      action: 'created',
      diff: {
        before: null,
        after: {} as any,
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id-xyz',
    };

    expect(userHistoryMapper.toRepo(history)).toEqual({
      userProfileId,
      actorType: EHistoryActorType.User,
      action: 'created',
      userId,
      diff: history.diff,
      correlationId: 'correlation-id-xyz',
      occurredAt: toRepoDate(occurredAt),
    });
  });
});
