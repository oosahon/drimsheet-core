import stringUtils from '../../../../shared/utils/string';
import { AppError } from '../../../../shared/value-objects/error';
import { ECategoryStatus, UCategoryStatus } from '../../types/category.types';

function validateStatus(status: UCategoryStatus) {
  if (!Object.values(ECategoryStatus).includes(status)) {
    throw new AppError(`Invalid category status: ${status}`);
  }
}

function sanitizeName(name: string) {
  return stringUtils.sanitizeAndValidate(name, {
    min: 1,
    max: 100,
  });
}

const categoryEntityHelpers = Object.freeze({
  validateStatus,
  sanitizeName,
});

export default categoryEntityHelpers;
