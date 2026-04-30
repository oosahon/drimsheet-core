import { DomainError, TErrorCause } from '../../../shared/utils/error';

type TErrorPrefix = `journal_entry_error_${string}`;

export class JournalEntryError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, key, cause);
  }
}

export default JournalEntryError;
