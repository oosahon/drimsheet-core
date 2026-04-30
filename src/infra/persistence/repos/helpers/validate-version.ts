import { IRepoOptions } from '../../../../shared/types/repo.types';
import { AppError } from '../../../../shared/utils/error';
import numberUtils from '../../../../shared/utils/number';

export default function validateVersionInOptions(options: IRepoOptions) {
  if (!options.expectedVersion) {
    throw new AppError('Version is required for update', { cause: options });
  }

  numberUtils.validateNonNegativeNumber(options.expectedVersion);
}
