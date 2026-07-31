import { IWriteRepoOptions } from '../types/repo.types';
import numberUtils from '../utils/number';
import repoError from '../values/errors/repo.error';

export default function validateVersionInOptions(options: IWriteRepoOptions) {
  if (!options.expectedVersion) {
    throw new repoError.VersionRequired();
  }

  numberUtils.validatePositiveNumber(
    options.expectedVersion,
    repoError.VersionRequired
  );
}
