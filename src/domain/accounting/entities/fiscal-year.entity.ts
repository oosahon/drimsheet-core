import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import accountingError from '../errors/accounting.error';
import periodEvents from '../events/period.events';
import { IFiscalYear } from '../types/fiscal-year.types';
import { EPeriodUnit } from '../types/period.types';
import fiscalYearHelpers from './helpers/fiscal-year.helpers';

interface IMakePayload extends Pick<
  IFiscalYear,
  'accountingEntityId' | 'startDate' | 'endDate' | 'status'
> {
  name?: string;
}

function make(
  payload: IMakePayload
): TEntityWithEvents<IFiscalYear, IFiscalYear> {
  fiscalYearHelpers.validateStatus(payload.status);
  fiscalYearHelpers.validateStartAndEndDate(payload);
  stringUtils.validateUUID(
    payload.accountingEntityId,
    accountingError.InvalidValue
  );

  const name = fiscalYearHelpers.deriveName(
    payload.startDate,
    payload.endDate,
    payload.name ?? null,
    false
  );
  const timestamp = new Date();

  const entity = Object.freeze({
    id: generateUUID(),
    name,
    accountingEntityId: payload.accountingEntityId,
    unit: EPeriodUnit.Month,
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

const fiscalYearEntity = Object.freeze({
  make,
  ...fiscalYearHelpers,
});

export default fiscalYearEntity;
