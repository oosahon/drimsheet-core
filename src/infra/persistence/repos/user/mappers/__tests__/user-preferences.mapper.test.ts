import { TEntityId } from '@shared/types/uuid';

import { IUserPreferences } from '@domain/user/types/user-preferences.types';

import userPreferencesMapper from '@infra/persistence/repos/user/mappers/user-preferences.mapper';

describe('User Preferences Mapper', () => {
  const createdAt = new Date('2026-04-10T12:00:00Z');
  const updatedAt = new Date('2026-04-10T12:30:00Z');

  const domainPreferences: IUserPreferences = {
    id: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    appPreferences: {
      theme: 'dark',
    },
    lastActiveAccountingEntityId:
      '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    createdAt,
    updatedAt,
  };

  const repoModel: Parameters<typeof userPreferencesMapper.toDomain>[0] = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    appPreferences: {
      theme: 'dark',
    },
    lastActiveAccountingEntityId: '123e4567-e89b-12d3-a456-426614174001',
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };

  describe('toRepo', () => {
    it('should map domain preferences to a repo model', () => {
      expect(userPreferencesMapper.toRepo(domainPreferences)).toEqual(
        repoModel
      );
    });

    it('should map a null accounting entity selection', () => {
      expect(
        userPreferencesMapper.toRepo({
          ...domainPreferences,
          lastActiveAccountingEntityId: null,
        }).lastActiveAccountingEntityId
      ).toBeNull();
    });
  });

  describe('toDomain', () => {
    it('should map a repo model to domain preferences', () => {
      expect(userPreferencesMapper.toDomain(repoModel)).toEqual(
        domainPreferences
      );
    });

    it('should map a null accounting entity selection to the domain', () => {
      expect(
        userPreferencesMapper.toDomain({
          ...repoModel,
          lastActiveAccountingEntityId: null,
        }).lastActiveAccountingEntityId
      ).toBeNull();
    });

    it('should reject an invalid accounting entity selection', () => {
      expect(() =>
        userPreferencesMapper.toDomain({
          ...repoModel,
          lastActiveAccountingEntityId: 'invalid-id',
        })
      ).toThrow();
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
