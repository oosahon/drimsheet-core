import { AppError } from '../../../../shared/utils/error';
import stringUtils from '../../../../shared/utils/string';
import {
  ECategoryHistoryAction,
  ECategoryStatus,
  UCategoryHistoryAction,
  UCategoryStatus,
} from '../../types/category.types';

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

function getHistoryNote(note: string | null) {
  if (!note) return null;

  return stringUtils.sanitizeAndValidate(note, {
    min: 1,
    max: 100,
  });
}

function validateHistoryAction(action: UCategoryHistoryAction) {
  if (!Object.values(ECategoryHistoryAction).includes(action)) {
    throw new AppError(`Invalid category history action: ${action}`);
  }
}

const categoryEntityHelpers = Object.freeze({
  validateStatus,
  sanitizeName,
  getHistoryNote,
  validateHistoryAction,
});

export default categoryEntityHelpers;
