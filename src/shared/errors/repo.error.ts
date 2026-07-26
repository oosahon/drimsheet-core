import { TErrorCause, TErrorKeys } from '../types/error.types';
import errorUtils from '../utils/error';
import DomainError from './domain.error';

type TErrorPrefix = `repo_error_${string}`;

const EErrorKeys = {
  VersionNotFound: 'repo_error_version_not_found',
  VersionRequired: 'repo_error_version_required',
  MissingHistory: 'repo_error_missing_history',
} as const satisfies TErrorKeys<TErrorPrefix>;

class RepoError extends DomainError<TErrorPrefix> {
  constructor(key: TErrorPrefix, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'RepoError';
  }
}

const repoError = Object.freeze({
  Base: RepoError,
  ...errorUtils.getMappedErrors(EErrorKeys, RepoError),
});

export default repoError;
