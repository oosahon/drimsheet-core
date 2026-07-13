import { IUser } from '../../../../../domain/user/types/user.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import userMapper from '../user.dto.mapper';

describe('User DTO Mapper', () => {
  describe('toInterface', () => {
    it('should map user to interface correctly and freeze it', () => {
      const mockUser: IUser = {
        id: 'user-id-123' as unknown as TEntityId,
        email: 'john.doe@example.com',
        emailVerified: true,
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date('2026-07-13T18:00:00Z'),
        updatedAt: new Date('2026-07-13T18:00:00Z'),
        deletedAt: null,
      };

      const result = userMapper.toInterface(mockUser);

      expect(result).toEqual(mockUser);
      expect(Object.isFrozen(result)).toBe(true);
    });
  });
});
