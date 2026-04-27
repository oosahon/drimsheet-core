import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import currencyEntity from '../../currency/entities/currency.entity';
import reportingContextEvents from '../events/reporting-context.events';
import { IReportingContext } from '../types/context.types';

function make(
  payload: TCreationOmits<IReportingContext, 'closedAt'>
): TEntityWithEvents<IReportingContext, IReportingContext> {
  stringUtils.validateUUID(payload.accountEntityId);
  currencyEntity.validateCode(payload.reportingCurrencyCode);
  stringUtils.validateUUID(payload.accountingContextId);
  stringUtils.validateUUID(payload.currentReportingPeriodId);

  const timestamp = new Date();

  const entity: IReportingContext = Object.freeze({
    id: generateUUID(),
    accountEntityId: payload.accountEntityId,
    reportingCurrencyCode: payload.reportingCurrencyCode,
    accountingContextId: payload.accountingContextId,
    currentReportingPeriodId: payload.currentReportingPeriodId,
    createdAt: timestamp,
    updatedAt: timestamp,
    closedAt: null,
  });

  const events = reportingContextEvents.created(entity);

  return [entity, [events]];
}

const reportingContextEntity = Object.freeze({
  make,
});

export default reportingContextEntity;
