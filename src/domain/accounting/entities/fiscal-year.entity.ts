import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import deriveFiscalYearName from '@domain/accounting/entities/helpers/derive-name.helper';
import fiscalYearValidation from '@domain/accounting/entities/validations/fiscal-year.validation';
import accountingError from '@domain/accounting/errors/accounting.error';
import periodEvents from '@domain/accounting/events/period.events';
import { IFiscalYear } from '@domain/accounting/types/fiscal-year.types';
import { EPeriodActions } from '@domain/accounting/types/period-audit.types';
import { EPeriodUnit } from '@domain/accounting/types/period.types';
import fiscalYearAudit from '@domain/accounting/values/fiscal-year-audit.vo';

interface IMakePayload extends Pick<
  IFiscalYear,
  'accountingEntityId' | 'startDate' | 'endDate' | 'status'
> {
  name?: string;
}

function make(
  payload: IMakePayload
): TAuditedEntity<IFiscalYear, IFiscalYear, IFiscalYear> {
  fiscalYearValidation.validateStatus(payload.status);
  fiscalYearValidation.validateStartAndEndDate(payload);
  stringUtils.validateUUID(
    payload.accountingEntityId,
    accountingError.InvalidValue
  );

  const name = deriveFiscalYearName(
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
  ...fiscalYearValidation,
});

export default fiscalYearEntity;
