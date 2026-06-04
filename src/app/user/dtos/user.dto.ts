import z from 'zod';
import {
  EAppUsageModePreference,
  UAppUsageModePreference,
} from '../../../domain/user/types/user-preferences.types';

export const userAppUsageModePreferenceValidation = z.enum(
  Object.values(EAppUsageModePreference) as [
    UAppUsageModePreference,
    ...UAppUsageModePreference[],
  ],
  'Unsupported user app usage mode'
);
