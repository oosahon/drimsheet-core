import { TEntityId } from '@shared/types/uuid';

import { IUserHistory } from '@domain/user/types/user-audit.types';

import { toRepoDate } from '@infra/persistence/helpers/date.mapper';
import userHistoryMapper from '@infra/persistence/repos/user/mappers/user-history.mapper';

describe('userHistoryMapper', () => {
  it('maps user history to the repository model', () => {
    const userProfileId = 'user-profile-uuid' as TEntityId;
    const userId = 'user-uuid' as TEntityId;
    const occurredAt = new Date('2026-07-25T12:00:00.000Z');

    const history: IUserHistory = {
      entityId: userProfileId,
      entityVersion: 1,
      action: 'created',
      diff: {
        before: null,
        after: {
          createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
          actorId: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
        } as any,
      },
      occurredAt,
      actorId: userId,
      onBehalfOf: null,
      correlationId: 'correlation-id-xyz',
    };

    expect(userHistoryMapper.toRepo(history)).toEqual({
      userProfileId,
      actorId: userId,
      onBehalfOf: null,
      action: 'created',
      diff: history.diff,
      correlationId: 'correlation-id-xyz',
      occurredAt: toRepoDate(occurredAt),
    });
  });
});
