import { AppError } from '../../../shared/errors/error';
import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { TEntityId } from '../../../shared/types/uuid';
import stringUtils from '../../../shared/utils/string';
import userEvents from '../events/user.events';
import {
  EAppThemePreference,
  EAppUsageModePreference,
  IUserAppPreferences,
  IUserPreferences,
} from '../types/user-preferences.types';

function makeAppPreferences(appPreferences: IUserAppPreferences) {
  const { theme, appUsageMode } = appPreferences;
  const isInvalidTheme =
    theme && !Object.values(EAppThemePreference).includes(theme);
  const isInvalidUsageMode =
    appUsageMode &&
    !Object.values(EAppUsageModePreference).includes(appUsageMode);

  if (isInvalidTheme) {
    throw new AppError('Invalid app preferences', {
      cause: appPreferences,
    });
  }

  if (isInvalidUsageMode) {
    throw new AppError('Invalid app preferences', {
      cause: appPreferences,
    });
  }

  return Object.freeze({
    theme,
    appUsageMode,
  });
}

function make(
  userId: TEntityId,
  payload: TCreationOmits<IUserPreferences>
): TEntityWithEvents<IUserPreferences, IUserPreferences> {
  stringUtils.validateUUID(userId);

  const timestamp = new Date();

  const entity: IUserPreferences = Object.freeze({
    id: userId,
    appPreferences: makeAppPreferences(payload.appPreferences),
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const event = userEvents.preferencesUpdated(entity);
  return [entity, [event]] as const;
}

function update(entity: IUserPreferences, payload: Partial<IUserPreferences>) {
  const updatedEntity: IUserPreferences = Object.freeze({
    id: entity.id,
    createdAt: entity.createdAt,
    appPreferences: payload.appPreferences
      ? makeAppPreferences(payload.appPreferences)
      : entity.appPreferences,
    updatedAt: new Date(),
  });

  const event = userEvents.preferencesUpdated(updatedEntity);
  return [updatedEntity, [event]] as const;
}

const userPreferencesEntity = Object.freeze({
  make,
  update,
});

export default userPreferencesEntity;
