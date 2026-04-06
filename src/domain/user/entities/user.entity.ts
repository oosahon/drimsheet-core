import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import userEvents from '../events/user.events';

import { IUser } from '../types/user.types';
import emailValue from '../value-objects/email.vo';

function validate(user: IUser) {
  stringUtils.validateUUID(user.id);

  stringUtils.sanitizeAndValidate(user.firstName, {
    min: 1,
    max: 100,
  });

  stringUtils.sanitizeAndValidate(user.lastName, {
    min: 1,
    max: 100,
  });

  emailValue.validate(user.email);
}

const userHelpers = Object.freeze({
  validate,
});

function make(payload: TCreationOmits<IUser>): TEntityWithEvents<IUser, IUser> {
  const timestamp = new Date();

  const firstName = stringUtils.sanitizeAndValidate(payload.firstName, {
    min: 1,
    max: 100,
  });

  const lastName = stringUtils.sanitizeAndValidate(payload.lastName, {
    min: 1,
    max: 100,
  });

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

  return [user, [events]];
}

function verifyEmail(user: IUser): TEntityWithEvents<IUser, IUser> {
  if (user.emailVerified) {
    return [user, []];
  }

  userHelpers.validate(user);

  const updatedUser = Object.freeze({
    ...user,
    emailVerified: true,
    updatedAt: new Date(),
  });

  const event = userEvents.emailVerified(updatedUser);

  return [updatedUser, [event]];
}

function update(
  user: IUser,
  options: Partial<Pick<IUser, 'firstName' | 'lastName'>>
): TEntityWithEvents<IUser, IUser> {
  userHelpers.validate(user);

  const firstName = stringUtils.sanitizeAndValidate(
    options.firstName ?? user.firstName,
    {
      min: 1,
      max: 100,
    }
  );

  const lastName = stringUtils.sanitizeAndValidate(
    options.lastName ?? user.lastName,
    {
      min: 1,
      max: 100,
    }
  );

  const isUnchanged =
    firstName === user.firstName && lastName === user.lastName;

  if (isUnchanged) {
    return [user, []] as TEntityWithEvents<IUser, IUser>;
  }

  const updatedUser: IUser = Object.freeze({
    ...user,
    firstName,
    lastName,
    updatedAt: new Date(),
  });

  const event = userEvents.updated(updatedUser);

  return [updatedUser, [event]];
}

const userEntity = Object.freeze({
  make,
  verifyEmail,
  update,
  ...userHelpers,
});

export default userEntity;
