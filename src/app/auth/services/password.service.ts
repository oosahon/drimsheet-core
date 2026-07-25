import bcrypt from 'bcryptjs';
import IPasswordService from '../contracts/password-service.contract';
import authError from '../errors/auth.error';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  satisfiesPasswordComplexity,
} from '../policies/password.policy';

export default function makePasswordService(): IPasswordService {
  return {
    makePassword(input) {
      if (
        typeof input !== 'string' ||
        input.length < PASSWORD_MIN_LENGTH ||
        input.length > PASSWORD_MAX_LENGTH ||
        !satisfiesPasswordComplexity(input)
      ) {
        throw new authError.InvalidPassword({ input });
      }

      return input;
    },

    async hash(password) {
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(password, salt);
    },

    async compare(password, hashedPassword) {
      return bcrypt.compare(password, hashedPassword);
    },
  };
}
