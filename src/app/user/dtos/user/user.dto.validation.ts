import z from 'zod';
import userPreferencesError from '../../../../domain/user/errors/user-preferences.error';
import {
  EAppUsageModePreference,
  UAppUsageModePreference,
} from '../../../../domain/user/types/user-preferences.types';

export const userAppUsageModePreferenceValidation = z.enum(
  Object.values(EAppUsageModePreference) as [
    UAppUsageModePreference,
    ...UAppUsageModePreference[],
  ],
  new userPreferencesError.InvalidAppUsageMode().errorKey
);
