import { TEntityWithEvents } from '../../../shared/types/event.types';
import dateUtils from '../../../shared/utils/date';
import numberUtils from '../../../shared/utils/number';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { AppError } from '../../../shared/value-objects/error';
import periodEvents from '../events/period.events';
import {
  EPeriodMeasurement,
  EPeriodStatus,
  IAccountingPeriod,
  IFiscalYear,
  IReportingPeriod,
  UPeriodMeasurement,
  UPeriodStatus,
} from '../types/period.types';

function isValidMeasurement(
  measurement: unknown
): measurement is UPeriodMeasurement {
  return Object.values(EPeriodMeasurement).includes(
    measurement as UPeriodMeasurement
  );
}

function validateMeasurement(measurement: unknown) {
  if (!isValidMeasurement(measurement)) {
    throw new AppError('Invalid period measurement', {
      cause: measurement as Record<string, unknown>,
    });
  }
}

function isValidStatus(status: unknown): status is UPeriodStatus {
  return Object.values(EPeriodStatus).includes(status as UPeriodStatus);
}

function validateStatus(status: unknown) {
  if (!isValidStatus(status)) {
    throw new AppError('Invalid period status', {
      cause: status as Record<string, unknown>,
    });
  }
}

function makeFiscalYear(
  payload: Pick<
    IFiscalYear,
    'name' | 'accountingEntityId' | 'startDate' | 'endDate' | 'status'
  >
): TEntityWithEvents<IFiscalYear, IFiscalYear> {
  const name = stringUtils.sanitizeAndValidate(payload.name, {
    min: 1,
    max: 100,
  });

  stringUtils.validateUUID(payload.accountingEntityId);

  dateUtils.validateDate(payload.startDate);
  dateUtils.validateDate(payload.endDate);

  dateUtils.validateGreaterThan(
    payload.endDate,
    payload.startDate,
    'Start date must be before end date'
  );

  validateStatus(payload.status);

  const timestamp = new Date();

  const entity = Object.freeze({
    id: generateUUID(),
    name,
    accountingEntityId: payload.accountingEntityId,
    measurement: EPeriodMeasurement.Month,
    count: 12,
    startDate: payload.startDate,
    endDate: payload.endDate,
    status: payload.status,
    closedAt: null,
    updatedAt: timestamp,
  });

  const events = periodEvents.fiscalYearCreated(entity);

  return [entity, [events]];
}

function makeAccountingPeriod(
  payload: Pick<
    IAccountingPeriod,
    | 'name'
    | 'accountingEntityId'
    | 'fiscalYearId'
    | 'measurement'
    | 'count'
    | 'startDate'
    | 'endDate'
    | 'status'
  >
): TEntityWithEvents<IAccountingPeriod, IAccountingPeriod> {
  const name = stringUtils.sanitizeAndValidate(payload.name, {
    min: 1,
    max: 100,
  });

  stringUtils.validateUUID(payload.accountingEntityId);
  stringUtils.validateUUID(payload.fiscalYearId);

  validateMeasurement(payload.measurement);

  numberUtils.validatePositiveNumber(payload.count, 'Invalid period count');

  dateUtils.validateDate(payload.startDate);
  dateUtils.validateDate(payload.endDate);

  dateUtils.validateGreaterThan(
    payload.endDate,
    payload.startDate,
    'Start date must be before end date'
  );

  validateStatus(payload.status);

  const timestamp = new Date();

  const entity = Object.freeze({
    id: generateUUID(),
    name,
    accountingEntityId: payload.accountingEntityId,
    fiscalYearId: payload.fiscalYearId,
    measurement: payload.measurement,
    count: payload.count,
    startDate: payload.startDate,
    endDate: payload.endDate,
    status: payload.status,
    closedAt: null,
    updatedAt: timestamp,
  });

  const events = periodEvents.accountingPeriodCreated(entity);

  return [entity, [events]];
}

function makeReportingPeriod(
  payload: Pick<
    IReportingPeriod,
    | 'name'
    | 'accountingEntityId'
    | 'fiscalYearId'
    | 'measurement'
    | 'count'
    | 'startDate'
    | 'endDate'
  >
): TEntityWithEvents<IReportingPeriod, IReportingPeriod> {
  const name = stringUtils.sanitizeAndValidate(payload.name, {
    min: 1,
    max: 100,
  });

  stringUtils.validateUUID(payload.accountingEntityId);
  stringUtils.validateUUID(payload.fiscalYearId);

  validateMeasurement(payload.measurement);

  numberUtils.validatePositiveNumber(payload.count, 'Invalid period count');

  dateUtils.validateDate(payload.startDate);
  dateUtils.validateDate(payload.endDate);

  dateUtils.validateGreaterThan(
    payload.endDate,
    payload.startDate,
    'Start date must be before end date'
  );

  const entity = Object.freeze({
    id: generateUUID(),
    name,
    accountingEntityId: payload.accountingEntityId,
    fiscalYearId: payload.fiscalYearId,
    measurement: payload.measurement,
    count: payload.count,
    startDate: payload.startDate,
    endDate: payload.endDate,
  });

  const events = periodEvents.reportingPeriodCreated(entity);

  return [entity, [events]];
}

const periodEntity = Object.freeze({
  makeFiscalYear,
  makeAccountingPeriod,
  makeReportingPeriod,

  isValidMeasurement,
  validateMeasurement,

  isValidStatus,
  validateStatus,
});

export default periodEntity;
