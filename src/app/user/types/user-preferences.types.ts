import { TEntityId } from '@shared/types/uuid';

export const EAppUsageModePreference = {
  PowerUser: 'power_user',
  NonPowerUser: 'non_power_user',
} as const;

export const EAppThemePreference = {
  Light: 'light',
  Dark: 'dark',
  System: 'system',
} as const;

export type UAppUsageModePreference =
  (typeof EAppUsageModePreference)[keyof typeof EAppUsageModePreference];
export type UAppThemePreference =
  (typeof EAppThemePreference)[keyof typeof EAppThemePreference];

export interface IUserAppPreferences {
  theme?: UAppThemePreference;
  appUsageMode: UAppUsageModePreference;
  suppressJournalEntryRectificationNotice?: boolean;
}

export interface IUserPreferences {
  userId: TEntityId;
  lastActiveAccountingEntityId: TEntityId | null;
  appPreferences: IUserAppPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPreferencesUpdate {
  userId: TEntityId;
  appPreferences?: {
    theme?: UAppThemePreference;
    appUsageMode?: UAppUsageModePreference;
    suppressJournalEntryRectificationNotice?: boolean;
  };
  lastActiveAccountingEntityId?: TEntityId | null;
}
