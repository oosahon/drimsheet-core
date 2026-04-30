import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import eventValue from '../../../shared/value-objects/event.vo';
import userActivityError from '../errors/user-activity.errors';
import { IUserActivity } from '../types/user-activity.types';

function make(payload: TCreationOmits<IUserActivity>) {
  stringUtils.validateUUID(payload.userId);

  eventValue.validateKey(payload.eventKey);

  const description = stringUtils.sanitizeAndValidate(payload.description, {
    min: 1,
    max: 100,
  });

  if (payload.meta && typeof payload.meta !== 'object') {
    throw new userActivityError.InvalidMeta({ cause: payload.meta });
  }

  const userActivity: IUserActivity = Object.freeze({
    id: generateUUID(),
    userId: payload.userId,
    eventKey: payload.eventKey,
    description,
    meta: payload.meta,
    createdAt: new Date(),
  });

  return userActivity;
}

const userActivityEntity = Object.freeze({
  make,
});

export default userActivityEntity;
