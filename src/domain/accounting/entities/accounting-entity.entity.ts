import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import currencyEntity from '../../currency/entities/currency.entity';
import accountingEntityEvents from '../events/accounting-entity.events';
import { IAccountingEntity } from '../types/accounting-entity.types';
import helpers from './helpers/accounting-entity.entity.helpers';

function make(
  payload: TCreationOmits<IAccountingEntity>
): TEntityWithEvents<IAccountingEntity, IAccountingEntity> {
  helpers.validateType(payload.type);
  stringUtils.validateUUID(payload.ownerId);
  currencyEntity.validateCode(payload.functionalCurrencyCode);
  helpers.validateJurisdictionCode(payload.jurisdictionCode);

  const name = stringUtils.sanitizeAndValidate(payload.name, {
    min: 1,
    max: 100,
  });

  const timestamp = new Date();

  const entity = Object.freeze({
    id: generateUUID(),
    name,
    type: payload.type,
    ownerId: payload.ownerId,
    functionalCurrencyCode: payload.functionalCurrencyCode,
    jurisdictionCode: payload.jurisdictionCode,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const events = accountingEntityEvents.created(entity);

  return [entity, [events]];
}

const accountingEntityEntity = Object.freeze({
  make,

  ...helpers,
});

export default accountingEntityEntity;
