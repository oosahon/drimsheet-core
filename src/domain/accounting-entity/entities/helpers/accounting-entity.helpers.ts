import {
  AppError,
  ErrorForbidden,
  ErrorUnauthorized,
} from '../../../../shared/value-objects/error';
import { IUser } from '../../../user/types/user.types';
import accountingEntitySupportedCountries from '../../config/supported-countries.config';
import {
  EAccountingEntityType,
  IAccountingEntity,
  IFiscalYearStart,
  UAccountingEntityType,
} from '../../types/accounting-entity.types';

const DAYS_IN_MONTH: Record<number, number> = {
  1: 31,
  2: 29, // Allow Feb 29 (leap year); application-layer handles non-leap years
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31,
};

function validateFiscalYearStart(fiscalYearStart: IFiscalYearStart) {
  const { month, day } = fiscalYearStart;

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12
  ) {
    throw new AppError('Invalid fiscal year-end month', { cause: month });
  }

  const maxDay = DAYS_IN_MONTH[month];
  if (day < 1 || day > maxDay) {
    throw new AppError('Invalid fiscal year-end day', {
      cause: { month, day },
    });
  }
}

function validateType(entityType: UAccountingEntityType) {
  if (!Object.values(EAccountingEntityType).includes(entityType)) {
    throw new AppError('Invalid accounting entity type', { cause: entityType });
  }
}

function validateName(name: string) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Invalid accounting entity name', { cause: name });
  }
}

function validateOperatingCountryCode(operatingCountryCode: string) {
  const supported = accountingEntitySupportedCountries.find(
    (c) => c.code === operatingCountryCode
  );
  if (!supported) {
    throw new AppError('Invalid operating country code', {
      cause: operatingCountryCode,
    });
  }
}

function validateAccess(accountingEntity: IAccountingEntity, user: IUser) {
  if (!accountingEntity || !user) throw new ErrorUnauthorized();

  // TODO: add more roles later
  const canAccess = accountingEntity.ownerId === user.id;

  if (!canAccess) throw new ErrorForbidden('Access denied.');

  return;
}

const accountingEntityHelpers = Object.freeze({
  validateFiscalYearStart,
  validateType,
  validateName,
  validateOperatingCountryCode,
  validateAccess,
});

export default accountingEntityHelpers;
