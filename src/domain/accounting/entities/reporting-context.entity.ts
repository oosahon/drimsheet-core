import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import currencyEntity from '../../currency/entities/currency.entity';
import accountingError from '../errors/accounting.error';
import reportingContextEvents from '../events/reporting-context.events';
import { IReportingContext } from '../types/context.types';
import helpers from './helpers/accounting-context.entity.helpers';

function make(
  payload: TCreationOmits<IReportingContext, 'closedAt'>
): TEntityWithEvents<IReportingContext, IReportingContext> {
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

  return [entity, [events]];
}

const reportingContextEntity = Object.freeze({
  make,
});

export default reportingContextEntity;
