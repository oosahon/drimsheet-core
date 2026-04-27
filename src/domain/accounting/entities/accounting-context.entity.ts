import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import currencyEntity from '../../currency/entities/currency.entity';
import accountingContextEvents from '../events/accounting-context.events';
import { IAccountingContext } from '../types/context.types';
import accountingContextEntityHelpers from './helpers/accounting-context.entity.helpers';

function make(
  payload: TCreationOmits<IAccountingContext, 'closedAt'>
): TEntityWithEvents<IAccountingContext, IAccountingContext> {
  stringUtils.validateUUID(payload.accountEntityId);
  currencyEntity.validateCode(payload.functionalCurrencyCode);
  accountingContextEntityHelpers.validateJurisdictionCode(
    payload.jurisdictionCode
  );
  accountingContextEntityHelpers.validateAccountingStandardCode(
    payload.accountingStandardCode
  );
  stringUtils.validateUUID(payload.fiscalYearId);
  stringUtils.validateUUID(payload.currentAccountingPeriodId);

  const timestamp = new Date();

  const entity: IAccountingContext = Object.freeze({
    id: generateUUID(),
    accountEntityId: payload.accountEntityId,
    functionalCurrencyCode: payload.functionalCurrencyCode,
    jurisdictionCode: payload.jurisdictionCode,
    accountingStandardCode: payload.accountingStandardCode,
    fiscalYearId: payload.fiscalYearId,
    currentAccountingPeriodId: payload.currentAccountingPeriodId,
    createdAt: timestamp,
    updatedAt: timestamp,
    closedAt: null,
  });

  const events = accountingContextEvents.created(entity);

  return [entity, [events]];
}

const accountingContextEntity = Object.freeze({
  make,

  ...accountingContextEntityHelpers,
});

export default accountingContextEntity;
