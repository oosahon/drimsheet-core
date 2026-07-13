import stringUtils from '../../../../shared/utils/string';
import userError from '../../errors/user.error';
import { IUser } from '../../types/user.types';
import emailValue from '../../values/email.vo';

function validate(user: IUser) {
  stringUtils.validateUUID(user.id, userError.InvalidValue);

  stringUtils.sanitizeAndValidate(
    user.firstName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidValue
  );

  stringUtils.sanitizeAndValidate(
    user.lastName,
    {
      min: 1,
      max: 100,
    },
    userError.InvalidValue
  );

  emailValue.validate(user.email);
}

const userEntityHelpers = Object.freeze({
  validate,
});

export default userEntityHelpers;
