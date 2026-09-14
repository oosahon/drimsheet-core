import { TCreationOmits } from '@shared/types/creation-omits.types';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import {
  IEvent,
  TAuditedEntity,
} from '@shared/values/events/types/event.types';

import userValidation from '@domain/user/entities/validations/user.validation';
import userError from '@domain/user/errors/user.error';
import userEvents from '@domain/user/events/user.events';
import {
  EUserEntityActions,
  IUserAudit,
} from '@domain/user/types/user-audit.types';
import { IUser } from '@domain/user/types/user.types';
import emailValue from '@domain/user/values/email.vo';
import userAudit from '@domain/user/values/user-audit.vo';

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
    userError.InvalidFirstName
  );

  const lastName = stringUtils.sanitizeAndValidate(
    payload.lastName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidLastName
  );

  const user: IUser = Object.freeze({
    id: generateUUID(),
    email: emailValue.make(payload.email),
    emailVerified: !!payload.emailVerified,
    firstName,
    lastName,
    version: 1,
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

  userValidation.validate(user);

  const updatedUser = Object.freeze({
    id: user.id,
    email: user.email,
    emailVerified: true,
    firstName: user.firstName,
    lastName: user.lastName,
    version: user.version + 1,
    createdAt: user.createdAt,
    updatedAt: new Date(),
    deletedAt: user.deletedAt,
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
  userValidation.validate(user);

  const firstName = stringUtils.sanitizeAndValidate(
    options.firstName ?? user.firstName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidFirstName
  );

  const lastName = stringUtils.sanitizeAndValidate(
    options.lastName ?? user.lastName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidLastName
  );

  const isUnchanged =
    firstName === user.firstName && lastName === user.lastName;

  if (isUnchanged) {
    return [user, [], null];
  }

  const updatedUser: IUser = Object.freeze({
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    firstName,
    lastName,
    version: user.version + 1,
    createdAt: user.createdAt,
    updatedAt: new Date(),
    deletedAt: user.deletedAt,
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
  ...userValidation,
});

export default userEntity;
