import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import accountingError from '../errors/accounting.error';
import periodEvents from '../events/period.events';
import { IFiscalYear } from '../types/fiscal-year.types';
import { EPeriodActions } from '../types/period-audit.types';
import { EPeriodUnit } from '../types/period.types';
import fiscalYearAudit from '../values/fiscal-year-audit.vo';
import fiscalYearHelpers from './helpers/fiscal-year.helpers';

interface IMakePayload extends Pick<
  IFiscalYear,
  'accountingEntityId' | 'startDate' | 'endDate' | 'status'
> {
  name?: string;
}

function make(
  payload: IMakePayload
): TAuditedEntity<IFiscalYear, IFiscalYear, IFiscalYear> {
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

  const audit = fiscalYearAudit.make({
    before: null,
    after: entity,
    action: EPeriodActions.Created,
  });

  return [entity, [events], audit];
}

const fiscalYearEntity = Object.freeze({
  make,
  ...fiscalYearHelpers,
});

export default fiscalYearEntity;
