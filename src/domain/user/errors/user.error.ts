import { TErrorCause, TErrorKey, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

type TErrorPrefix = TErrorKey<'user_error'>;

const EErrorKeys = {
  InvalidValue: 'user_error_value_invalid',
  InvalidAction: 'user_error_action_invalid',
  InvalidId: 'user_error_id_invalid',
  InvalidDate: 'user_error_date_invalid',
} as const satisfies TErrorKeys<'user_error'>;

type UUserError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class UserError<K extends TErrorPrefix = UUserError> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'UserError';
  }
}

const userError = Object.freeze({
  Base: UserError,
  ...errorUtils.getMappedErrors(EErrorKeys, UserError),
});

export default userError;
