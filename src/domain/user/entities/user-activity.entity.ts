import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { IUserActivity } from '../types/user-activity.types';
import generateUUID from '../../../shared/utils/uuid-generator';
import stringUtils from '../../../shared/utils/string';
import { AppError } from '../../../shared/value-objects/error';

function make(payload: TCreationOmits<IUserActivity>) {
  stringUtils.validateUUID(payload.userId);

  const eventKey = stringUtils.sanitizeAndValidate(payload.eventKey, {
    min: 1,
    max: 100,
  });

  const description = stringUtils.sanitizeAndValidate(payload.description, {
    min: 1,
    max: 100,
  });

  if (payload.meta && typeof payload.meta !== 'object') {
    throw new AppError('Meta must be an object', { cause: payload.meta });
  }

  const userActivity: IUserActivity = Object.freeze({
    id: generateUUID(),
    userId: payload.userId,
    eventKey,
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
