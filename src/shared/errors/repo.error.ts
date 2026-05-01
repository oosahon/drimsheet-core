import { TErrorCause, TErrorKeys } from '../types/error.types';
import errorUtils from '../utils/error';
import DomainError from './domain.error';

type TErrorPrefix = `repo_error_${string}`;

const EErrorKeys: TErrorKeys<TErrorPrefix> = {
  VersionNotFound: 'repo_error_version_not_found',
  VersionRequired: 'repo_error_version_required',
};

class RepoError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const repoError = Object.freeze({
  Base: RepoError,
  ...errorUtils.getMappedErrors(EErrorKeys, RepoError),
});

export default repoError;
