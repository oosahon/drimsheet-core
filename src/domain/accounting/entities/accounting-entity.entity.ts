import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { AppError } from '../../../shared/value-objects/error';
import currencyEntity from '../../currency/entities/currency.entity';
import accountingEntityTypeEvents from '../events/accounting-entity.events';
import {
  EAccountingEntityType,
  IAccountingEntity,
  IFiscalYearStart,
  UAccountingEntityType,
} from '../types/accounting.types';

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

function validate(entity: TCreationOmits<IAccountingEntity>) {
  stringUtils.validateUUID(entity.ownerId);
  currencyEntity.validateCode(entity.functionalCurrency.code);
  currencyEntity.validateCode(entity.reportingCurrency.code);
  validateType(entity.type);
  validateFiscalYearStart(entity.fiscalYearStart);
}

function make(
  payload: TCreationOmits<IAccountingEntity>
): TEntityWithEvents<IAccountingEntity, IAccountingEntity> {
  validate(payload);

  const timestamp = new Date();

  const domain: IAccountingEntity = Object.freeze({
    id: generateUUID(),
    ownerId: payload.ownerId,
    type: payload.type,
    functionalCurrency: payload.functionalCurrency,
    reportingCurrency: payload.reportingCurrency,
    fiscalYearStart: Object.freeze({ ...payload.fiscalYearStart }),
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  });

  const event = accountingEntityTypeEvents.created(domain);

  return [domain, [event]];
}

const accountingEntity = Object.freeze({
  make,
  validate,
  validateType,
  validateFiscalYearStart,
});

export default accountingEntity;
