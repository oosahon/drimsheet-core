import { IUserPreferences } from '../../../../domain/user/types/user-preferences.types';
import { TEntityId } from '../../../../shared/types/uuid';
import userPreferencesMapper from '../user-preferences.mapper';

describe('User Preferences Mapper', () => {
  const createdAt = new Date('2026-04-10T12:00:00Z');
  const updatedAt = new Date('2026-04-10T12:30:00Z');

  const domainPreferences: IUserPreferences = {
    id: 'pref-1' as TEntityId,
    appPreferences: {
      theme: 'dark',
    },
    createdAt,
    updatedAt,
  };

  const repoModel: Parameters<typeof userPreferencesMapper.toDomain>[0] = {
    id: 'pref-1',
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
  });
});
