import { IRepoOptions } from '../../../../shared/types/repo.types';
import numberUtils from '../../../../shared/utils/number';
import { AppError } from '../../../../shared/value-objects/error';

export default function validateVersionInOptions(options: IRepoOptions) {
  if (!options.expectedVersion) {
    throw new AppError('Version is required for update', { cause: options });
  }

  numberUtils.validateNonNegativeNumber(
    options.expectedVersion,
    'Entity version cannot be negative'
  );
}
