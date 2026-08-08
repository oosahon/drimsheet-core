import { TCreationOmits } from '@shared/types/creation-omits.types';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import helpers from '@domain/accounting/entities/helpers/accounting-context.entity.helpers';
import accountingError from '@domain/accounting/errors/accounting.error';
import reportingContextEvents from '@domain/accounting/events/reporting-context.events';
import { IReportingContext } from '@domain/accounting/types/context.types';
import { EReportingContextActions } from '@domain/accounting/types/reporting-context-audit.types';
import reportingContextAudit from '@domain/accounting/values/reporting-context-audit.vo';
import currencyEntity from '@domain/money/entities/currency.entity';

function make(
  payload: TCreationOmits<IReportingContext, 'closedAt'>
): TAuditedEntity<IReportingContext, IReportingContext, IReportingContext> {
  stringUtils.validateUUID(
    payload.accountingEntityId,
    accountingError.InvalidValue
  );
  currencyEntity.validateCode(payload.reportingCurrencyCode);
  stringUtils.validateUUID(
    payload.accountingContextId,
    accountingError.InvalidValue
  );
  stringUtils.validateUUID(
    payload.currentReportingPeriodId,
    accountingError.InvalidValue
  );
  helpers.validateAccountingStandardCode(payload.accountingStandardCode);

  const name = stringUtils.sanitizeAndValidate(
    payload.name,
    {
      min: 1,
      max: 150,
    },
    accountingError.InvalidValue
  );
  const description = helpers.getDescription(payload.description);

  const timestamp = new Date();

  const entity: IReportingContext = Object.freeze({
    id: generateUUID(),
    name,
    description,
    accountingEntityId: payload.accountingEntityId,
    reportingCurrencyCode: payload.reportingCurrencyCode,
    accountingContextId: payload.accountingContextId,
    currentReportingPeriodId: payload.currentReportingPeriodId,
    accountingStandardCode: payload.accountingStandardCode,
    createdAt: timestamp,
    updatedAt: timestamp,
    closedAt: null,
  });

  const events = reportingContextEvents.created(entity);

  const audit = reportingContextAudit.make({
    before: null,
    after: entity,
    action: EReportingContextActions.Created,
  });

  return [entity, [events], audit];
}

const reportingContextEntity = Object.freeze({
  make,
});

export default reportingContextEntity;
