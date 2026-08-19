import z from 'zod';

import {
  EAppUsageModePreference,
  UAppUsageModePreference,
} from '@app/user/contracts/user-preferences.types';
import userPreferencesAppError from '@app/user/errors/user-preferences.error';

export const userAppUsageModePreferenceValidation = z.enum(
  Object.values(EAppUsageModePreference) as [
    UAppUsageModePreference,
    ...UAppUsageModePreference[],
  ],
  new userPreferencesAppError.InvalidAppUsageMode().errorKey
);
