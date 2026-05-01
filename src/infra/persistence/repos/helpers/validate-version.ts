import repoError from '../../../../shared/errors/repo.error';
import { IRepoOptions } from '../../../../shared/types/repo.types';
import numberUtils from '../../../../shared/utils/number';

export default function validateVersionInOptions(options: IRepoOptions) {
  if (!options.expectedVersion) {
    throw new repoError.VersionRequired();
  }

  numberUtils.validatePositiveNumber(
    options.expectedVersion,
    repoError.VersionRequired
  );
}
