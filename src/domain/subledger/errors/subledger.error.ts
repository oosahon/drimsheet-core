import { DomainError, TErrorCause } from '../../../shared/utils/error';

type TErrorPrefix = `subledger_error_${string}`;

export class SubledgerError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

export default SubledgerError;
