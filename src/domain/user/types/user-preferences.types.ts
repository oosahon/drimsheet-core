import { TEntityId } from '../../../shared/types/uuid';

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
  theme?: UAppThemePreference | null;
  appUsageMode?: UAppUsageModePreference | null;
}

export interface IUserPreferences {
  id: TEntityId;
  appPreferences: IUserAppPreferences;
  createdAt: Date;
  updatedAt: Date;
}
