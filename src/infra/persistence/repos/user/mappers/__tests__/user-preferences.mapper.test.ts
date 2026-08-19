import { TEntityId } from '@shared/types/uuid';

import { IUserPreferences } from '@app/user/contracts/user-preferences.types';

import userPreferencesMapper from '@infra/persistence/repos/user/mappers/user-preferences.mapper';

describe('User Preferences Mapper', () => {
  const createdAt = new Date('2026-04-10T12:00:00Z');
  const updatedAt = new Date('2026-04-10T12:30:00Z');
  const lastActiveAccountingEntityId =
    '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

  const preferences: IUserPreferences = {
    userId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    lastActiveAccountingEntityId,
    appPreferences: {
      theme: 'dark',
    },
    createdAt,
    updatedAt,
  };

  const repoModel: Parameters<typeof userPreferencesMapper.toDomain>[0] = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    lastActiveAccountingEntityId,
    appPreferences: {
      theme: 'dark',
    },
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };

  it('maps application preferences to a repository model', () => {
    expect(userPreferencesMapper.toRepo(preferences)).toEqual({
      ...repoModel,
      appPreferences: {
        theme: 'dark',
        appUsageMode: undefined,
      },
    });
  });

  it('maps a repository model to immutable application preferences', () => {
    const result = userPreferencesMapper.toDomain(repoModel);

    expect(result).toEqual({
      ...preferences,
      appPreferences: {
        theme: 'dark',
        appUsageMode: undefined,
      },
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.appPreferences)).toBe(true);
  });

  it('maps null stored preferences to an empty preference object', () => {
    expect(
      userPreferencesMapper.toDomain({
        ...repoModel,
        lastActiveAccountingEntityId: null,
        appPreferences: null,
      })
    ).toEqual({
      ...preferences,
      lastActiveAccountingEntityId: null,
      appPreferences: {
        theme: undefined,
        appUsageMode: undefined,
      },
    });
  });
});
