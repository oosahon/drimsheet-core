import { IUser } from '../../../../../domain/user/types/user.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import userMapper from '../user.dto.mapper';

describe('User DTO Mapper', () => {
  describe('toProfileDto', () => {
    it('should map user to profile DTO correctly, freeze it, and exclude internal fields', () => {
      const mockUser: IUser & { extraField?: string } = {
        id: 'user-id-123' as unknown as TEntityId,
        email: 'john.doe@example.com',
        emailVerified: true,
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date('2026-07-13T18:00:00Z'),
        updatedAt: new Date('2026-07-13T18:00:00Z'),
        deletedAt: new Date('2026-07-14T18:00:00Z'),
        extraField: 'should-not-exist',
      };

      const result = userMapper.toProfileDto(mockUser);

      expect(result).toEqual({
        id: 'user-id-123',
        email: 'john.doe@example.com',
        emailVerified: true,
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date('2026-07-13T18:00:00Z'),
        updatedAt: new Date('2026-07-13T18:00:00Z'),
      });
      expect((result as any).deletedAt).toBeUndefined();
      expect((result as any).extraField).toBeUndefined();
      expect(Object.isFrozen(result)).toBe(true);
    });
  });
});
