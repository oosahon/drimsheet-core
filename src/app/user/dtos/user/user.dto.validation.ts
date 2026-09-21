import z from 'zod';

import userPreferencesAppError from '@app/user/errors/user-preferences.error';
import {
  EAppThemePreference,
  EAppUsageModePreference,
  UAppThemePreference,
  UAppUsageModePreference,
} from '@app/user/types/user-preferences.types';

export const userAppThemePreferenceValidation = z.enum(
  Object.values(EAppThemePreference) as [
    UAppThemePreference,
    ...UAppThemePreference[],
  ],
  new userPreferencesAppError.InvalidAppTheme().errorKey
);

export const userAppUsageModePreferenceValidation = z.enum(
  Object.values(EAppUsageModePreference) as [
    UAppUsageModePreference,
    ...UAppUsageModePreference[],
  ],
  new userPreferencesAppError.InvalidAppUsageMode().errorKey
);

export const userAppPreferencesValidation = z
  .object({
    theme: userAppThemePreferenceValidation.optional(),
    appUsageMode: userAppUsageModePreferenceValidation,
  })
  .strict();

export const userPreferencesUpdateDtoSchema = z
  .object({
    theme: userAppPreferencesValidation.shape.theme,
    appUsageMode: userAppPreferencesValidation.shape.appUsageMode.optional(),
  })
  .strict()
  .refine((preferences) => Object.keys(preferences).length > 0, {
    message: new userPreferencesAppError.InvalidAppPreferences().errorKey,
  });
