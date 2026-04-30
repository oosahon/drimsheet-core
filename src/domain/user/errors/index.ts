import { DomainError, TErrorCause } from '../../../shared/utils/error';

type TErrorPrefix = `user_error_${string}`;

export class UserError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, key, cause);
  }
}

export default UserError;
