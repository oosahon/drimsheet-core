// TODO: move app preferences to application layer https://drimsheet-app.atlassian.net/browse/ENG-49

import { TCreationOmits } from '@shared/types/creation-omits.types';
import { TEntityId } from '@shared/types/uuid';
import stringUtils from '@shared/utils/string';
import { TEntityWithEvents } from '@shared/values/events/types/event.types';

import userPreferencesError from '@domain/user/errors/user-preferences.error';
import userError from '@domain/user/errors/user.error';
import userEvents from '@domain/user/events/user.events';
import {
  EAppThemePreference,
  EAppUsageModePreference,
  IUserAppPreferences,
  IUserPreferences,
} from '@domain/user/types/user-preferences.types';

function makeAppPreferences(appPreferences?: IUserAppPreferences | null) {
  const { theme, appUsageMode } = appPreferences || {};
  const isInvalidTheme =
    theme && !Object.values(EAppThemePreference).includes(theme);
  const isInvalidUsageMode =
    appUsageMode &&
    !Object.values(EAppUsageModePreference).includes(appUsageMode);

  if (isInvalidTheme) {
    throw new userPreferencesError.InvalidAppPreferences({
      appPreferences,
    });
  }

  if (isInvalidUsageMode) {
    throw new userPreferencesError.InvalidAppPreferences({
      appPreferences,
    });
  }

  return Object.freeze({
    theme,
    appUsageMode,
  });
}

function make(
  userId: TEntityId,
  payload: TCreationOmits<IUserPreferences, 'lastActiveAccountingEntityId'>
): TEntityWithEvents<IUserPreferences, IUserPreferences> {
  stringUtils.validateUUID(userId, userError.InvalidValue);

  const timestamp = new Date();

  const entity: IUserPreferences = Object.freeze({
    id: userId,
    lastActiveAccountingEntityId: null,
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
    lastActiveAccountingEntityId: entity.lastActiveAccountingEntityId,
    createdAt: entity.createdAt,
    appPreferences: payload.appPreferences
      ? makeAppPreferences(payload.appPreferences)
      : entity.appPreferences,
    updatedAt: new Date(),
  });

  const event = userEvents.preferencesUpdated(updatedEntity);
  return [updatedEntity, [event]] as const;
}

function rehydrate(payload: IUserPreferences): IUserPreferences {
  stringUtils.validateUUID(payload.id, userError.InvalidValue);

  if (payload.lastActiveAccountingEntityId !== null) {
    stringUtils.validateUUID(
      payload.lastActiveAccountingEntityId,
      userError.InvalidValue
    );
  }

  return Object.freeze({
    id: payload.id,
    lastActiveAccountingEntityId: payload.lastActiveAccountingEntityId,
    appPreferences: makeAppPreferences(payload.appPreferences),
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  });
}

const userPreferencesEntity = Object.freeze({
  make,
  update,
  rehydrate,
});

export default userPreferencesEntity;
