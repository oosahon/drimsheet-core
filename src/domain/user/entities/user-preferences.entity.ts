import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import {
  IUserAppPreferences,
  IUserPreferences,
} from '../types/user-preferences.types';
import stringUtils from '../../../shared/utils/string';
import { AppError } from '../../../shared/value-objects/error';
import { TEntityId } from '../../../shared/types/uuid';
import userEvents from '../events/user.events';

function makeAppPreferences(appPreferences: IUserAppPreferences) {
  if (!['light', 'dark', 'system'].includes(appPreferences.theme)) {
    throw new AppError('Invalid theme preference', {
      cause: appPreferences.theme,
    });
  }

  return Object.freeze({
    theme: appPreferences.theme,
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
