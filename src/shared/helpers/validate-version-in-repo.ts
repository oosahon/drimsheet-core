import { IWriteRepoOptions } from '@shared/types/repo.types';
import numberUtils from '@shared/utils/number';
import repoError from '@shared/values/errors/repo.error';

export default function validateVersionInOptions(options: IWriteRepoOptions) {
  if (!options.expectedVersion) {
    throw new repoError.VersionRequired();
  }

  numberUtils.validatePositiveNumber(
    options.expectedVersion,
    repoError.VersionRequired
  );
}
