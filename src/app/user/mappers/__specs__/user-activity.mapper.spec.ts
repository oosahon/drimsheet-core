import { IUserActivity } from '../../../../domain/user/types/user-activity.types';
import { TEntityId } from '../../../../shared/types/uuid';
import userActivityMapper from '../user-activity.mapper';

describe('User Activity Mapper', () => {
  describe('toRepo', () => {
    it('should map domain user activity to repo model', () => {
      const createdAt = new Date('2026-04-10T12:00:00Z');

      const domainActivity: IUserActivity = {
        id: 'activity-1' as TEntityId,
        userId: 'user-1' as TEntityId,
        eventKey: 'USER_CREATED',
        description: 'User created their account',
        meta: { correlationId: 'corr-1', ip: '127.0.0.1' },
        createdAt,
      };

      const expectedRepoModel = {
        id: 'activity-1',
        userId: 'user-1',
        eventKey: 'USER_CREATED',
        description: 'User created their account',
        meta: { correlationId: 'corr-1', ip: '127.0.0.1' },
        createdAt: createdAt.toISOString(),
      };

      expect(userActivityMapper.toRepo(domainActivity)).toEqual(
        expectedRepoModel
      );
    });
  });
});
