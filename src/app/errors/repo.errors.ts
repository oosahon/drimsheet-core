import AppError from '../../shared/errors/app.error';
import { TErrorCause } from '../../shared/types/error.types';
import errorUtils from '../../shared/utils/error';

type TErrorKeyPrefix = `app_error_repo_${string}`;

const EErrorKeys = {
  VersionNotFound: 'app_error_repo_version_not_found',
  VersionRequired: 'app_error_repo_version_required',
} as const satisfies Record<string, TErrorKeyPrefix>;

type URepoError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class RepoError extends AppError<URepoError> {
  constructor(key: URepoError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'RepoError';
  }
}

const repoError = Object.freeze({
  Error: RepoError,
  ...errorUtils.getMappedErrors(EErrorKeys, RepoError),
});

export default repoError;
