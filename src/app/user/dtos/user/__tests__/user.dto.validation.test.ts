import { EAppUsageModePreference } from '@domain/user/types/user-preferences.types';

import { userAppUsageModePreferenceValidation } from '@app/user/dtos/user/user.dto.validation';

describe('User DTO Validation', () => {
  describe('userAppUsageModePreferenceValidation', () => {
    it('should validate valid app usage mode preferences', () => {
      expect(
        userAppUsageModePreferenceValidation.safeParse(
          EAppUsageModePreference.PowerUser
        ).success
      ).toBe(true);
      expect(
        userAppUsageModePreferenceValidation.safeParse(
          EAppUsageModePreference.NonPowerUser
        ).success
      ).toBe(true);
    });

    it('should fail on invalid app usage mode preference', () => {
      expect(
        userAppUsageModePreferenceValidation.safeParse('invalid_mode').success
      ).toBe(false);
    });
  });
});
