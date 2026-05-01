import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import accountingError from '../errors/accounting.error';
import accountingContextEvents from '../events/accounting-context.events';
import { IAccountingContext } from '../types/context.types';
import helpers from './helpers/accounting-context.entity.helpers';

function make(
  payload: TCreationOmits<IAccountingContext, 'closedAt'>
): TEntityWithEvents<IAccountingContext, IAccountingContext> {
  stringUtils.validateUUID(
    payload.accountingEntityId,
    accountingError.InvalidValue
  );
  helpers.validateAccountingStandardCode(payload.accountingStandardCode);
  stringUtils.validateUUID(payload.fiscalYearId, accountingError.InvalidValue);
  stringUtils.validateUUID(
    payload.currentAccountingPeriodId,
    accountingError.InvalidValue
  );

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

  const entity: IAccountingContext = Object.freeze({
    id: generateUUID(),
    name,
    description,
    accountingEntityId: payload.accountingEntityId,
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

  ...helpers,
});

export default accountingContextEntity;
