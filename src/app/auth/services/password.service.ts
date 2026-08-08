import IHasher from '@shared/contracts/hasher.contract';

import IPasswordService from '@app/auth/contracts/password-service.contract';
import authError from '@app/auth/errors/auth.error';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  satisfiesPasswordComplexity,
} from '@app/auth/policies/password.policy';

interface IDependencies {
  hasher: IHasher;
}

export default function makePasswordService(
  deps: IDependencies
): IPasswordService {
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
      const salt = await deps.hasher.genSalt(10);
      return deps.hasher.hash(password, salt);
    },

    async compare(password, hashedPassword) {
      return deps.hasher.compare(password, hashedPassword);
    },
  };
}
