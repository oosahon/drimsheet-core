import { IUserPreferences } from '../../../../../domain/user/types/user-preferences.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import userPreferencesMapper from '../user-preferences.mapper';

describe('User Preferences Mapper', () => {
  const createdAt = new Date('2026-04-10T12:00:00Z');
  const updatedAt = new Date('2026-04-10T12:30:00Z');

  const domainPreferences: IUserPreferences = {
    id: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    appPreferences: {
      theme: 'dark',
    },
    createdAt,
    updatedAt,
  };

  const repoModel: Parameters<typeof userPreferencesMapper.toDomain>[0] = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    appPreferences: {
      theme: 'dark',
    },
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };

  describe('toRepo', () => {
    it('should map domain preferences to a repo model', () => {
      expect(userPreferencesMapper.toRepo(domainPreferences)).toEqual(
        repoModel
      );
    });
  });

  describe('toDomain', () => {
    it('should map a repo model to domain preferences', () => {
      expect(userPreferencesMapper.toDomain(repoModel)).toEqual(
        domainPreferences
      );
    });

    it('should throw UserPreferencesError for invalid theme', () => {
      const invalidRepoModel = {
        ...repoModel,
        appPreferences: {
          theme: 'invalid-theme',
        },
      };

      expect(() =>
        userPreferencesMapper.toDomain(invalidRepoModel as any)
      ).toThrow();
    });

    it('should throw UserPreferencesError for invalid usage mode', () => {
      const invalidRepoModel = {
        ...repoModel,
        appPreferences: {
          appUsageMode: 'invalid-mode',
        },
      };

      expect(() =>
        userPreferencesMapper.toDomain(invalidRepoModel as any)
      ).toThrow();
    });
  });
});
