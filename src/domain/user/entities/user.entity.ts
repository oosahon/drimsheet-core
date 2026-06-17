import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { IEvent, TAuditedEntity } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import userEvents from '../events/user.events';

import userError from '../errors/user.error';
import { EUserEntityActions, IUserAudit } from '../types/user-audit.types';
import { IUser } from '../types/user.types';
import emailValue from '../value-objects/email.vo';
import userAudit from '../value-objects/user-audit.vo';
import helpers from './helpers/user.entity.helpers';

function make(
  payload: TCreationOmits<IUser>
): TAuditedEntity<IUser, IUser, IUser> {
  const timestamp = new Date();

  const firstName = stringUtils.sanitizeAndValidate(
    payload.firstName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidValue
  );

  const lastName = stringUtils.sanitizeAndValidate(
    payload.lastName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidValue
  );

  const user: IUser = Object.freeze({
    id: generateUUID(),
    email: emailValue.make(payload.email),
    emailVerified: !!payload.emailVerified,
    firstName,
    lastName,
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const events = userEvents.created(user);

  const audit = userAudit.make({
    before: null,
    after: user,
    action: EUserEntityActions.Created,
  });

  return [user, [events], audit];
}

function verifyEmail(user: IUser): [IUser, IEvent<IUser>[], IUserAudit | null] {
  if (user.emailVerified) {
    return [user, [], null];
  }

  helpers.validate(user);

  const updatedUser = Object.freeze({
    ...user,
    emailVerified: true,
    updatedAt: new Date(),
  });

  const event = userEvents.emailVerified(updatedUser);

  const audit = userAudit.make({
    before: user,
    after: updatedUser,
    action: EUserEntityActions.EmailVerified,
  });

  return [updatedUser, [event], audit];
}

function update(
  user: IUser,
  options: Partial<Pick<IUser, 'firstName' | 'lastName'>>
): [IUser, IEvent<IUser>[], IUserAudit | null] {
  helpers.validate(user);

  const firstName = stringUtils.sanitizeAndValidate(
    options.firstName ?? user.firstName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidValue
  );

  const lastName = stringUtils.sanitizeAndValidate(
    options.lastName ?? user.lastName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidValue
  );

  const isUnchanged =
    firstName === user.firstName && lastName === user.lastName;

  if (isUnchanged) {
    return [user, [], null];
  }

  const updatedUser: IUser = Object.freeze({
    ...user,
    firstName,
    lastName,
    updatedAt: new Date(),
  });

  const event = userEvents.updated(updatedUser);

  const audit = userAudit.make({
    before: user,
    after: updatedUser,
    action: EUserEntityActions.Updated,
  });

  return [updatedUser, [event], audit];
}

const userEntity = Object.freeze({
  make,
  verifyEmail,
  update,
  ...helpers,
});

export default userEntity;
