import repoError from '../../../../app/errors/repo.errors';
import { IRepoOptions } from '../../../../shared/types/repo.types';
import numberUtils from '../../../../shared/utils/number';

export default function validateVersionInOptions(options: IRepoOptions) {
  if (!options.expectedVersion) {
    throw new repoError.VersionRequired();
  }

  numberUtils.validateNonNegativeNumber(options.expectedVersion);
}
