import repoError from '../../../../shared/errors/repo.error';
import { IWriteRepoOptions } from '../../../../shared/types/repo.types';
import numberUtils from '../../../../shared/utils/number';

export default function validateVersionInOptions(options: IWriteRepoOptions) {
  if (!options.expectedVersion) {
    throw new repoError.VersionRequired();
  }

  numberUtils.validatePositiveNumber(
    options.expectedVersion,
    repoError.VersionRequired
  );
}
