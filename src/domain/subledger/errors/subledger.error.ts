import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';

type TErrorPrefix = `subledger_error_${string}`;

class SubledgerError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

export default SubledgerError;
