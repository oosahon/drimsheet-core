import stringUtils from '@shared/utils/string';

import userError from '@domain/user/errors/user.error';
import { IUser } from '@domain/user/types/user.types';
import emailValue from '@domain/user/values/email.vo';

function validate(user: IUser) {
  if (user.deletedAt !== null) {
    throw new userError.InvalidAction({ reason: 'User is deleted' });
  }

  stringUtils.validateUUID(user.id, userError.InvalidId);

  stringUtils.sanitizeAndValidate(
    user.firstName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidFirstName
  );

  stringUtils.sanitizeAndValidate(
    user.lastName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidLastName
  );

  emailValue.validate(user.email);
}

const userValidation = Object.freeze({
  validate,
});

export default userValidation;
