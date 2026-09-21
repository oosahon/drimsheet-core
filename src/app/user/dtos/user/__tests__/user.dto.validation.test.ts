import {
  userAppPreferencesValidation,
  userAppThemePreferenceValidation,
  userAppUsageModePreferenceValidation,
  userPreferencesUpdateDtoSchema,
} from '@app/user/dtos/user/user.dto.validation';
import {
  EAppThemePreference,
  EAppUsageModePreference,
} from '@app/user/types/user-preferences.types';

describe('User DTO Validation', () => {
  it.each(Object.values(EAppThemePreference))(
    'validates the %s app theme',
    (theme) => {
      expect(userAppThemePreferenceValidation.safeParse(theme).success).toBe(
        true
      );
    }
  );

  it('rejects an unsupported app theme', () => {
    expect(userAppThemePreferenceValidation.safeParse('sepia').success).toBe(
      false
    );
  });

  it('validates supported app usage modes', () => {
    expect(
      userAppUsageModePreferenceValidation.safeParse(
        EAppUsageModePreference.NonPowerUser
      ).success
    ).toBe(true);
    expect(
      userAppUsageModePreferenceValidation.safeParse('power_user').success
    ).toBe(true);
  });

  it.each([
    { theme: EAppThemePreference.Dark },
    { appUsageMode: EAppUsageModePreference.NonPowerUser },
    { suppressJournalEntryRectificationNotice: true },
  ])('validates a non-empty preference update', (preferences) => {
    expect(userPreferencesUpdateDtoSchema.safeParse(preferences).success).toBe(
      true
    );
  });

  it('validates complete app preferences for composition', () => {
    expect(
      userAppPreferencesValidation.safeParse({
        theme: EAppThemePreference.System,
        appUsageMode: EAppUsageModePreference.PowerUser,
        suppressJournalEntryRectificationNotice: false,
      }).success
    ).toBe(true);
  });

  it.each([
    {},
    { theme: null },
    { appUsageMode: null },
    { unknown: true },
    { theme: EAppThemePreference.Dark, unknown: true },
  ])('rejects invalid preference updates', (preferences) => {
    expect(userPreferencesUpdateDtoSchema.safeParse(preferences).success).toBe(
      false
    );
  });
});
