import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import currencyEntity from '../../currency/entities/currency.entity';
import accountingEntityEvents from '../events/accounting-entity.events';
import { IAccountingEntity } from '../types/accounting-entity.types';
import helpers from './helpers/accounting-entity.helpers';

function make(
  payload: TCreationOmits<IAccountingEntity>
): TEntityWithEvents<IAccountingEntity, IAccountingEntity> {
  stringUtils.validateUUID(payload.ownerId);
  stringUtils.validateUUID(payload.accountingContextId);
  helpers.validateName(payload.name);
  helpers.validateOperatingCountryCode(payload.operatingCountryCode);
  currencyEntity.validateCode(payload.functionalCurrency.code);
  currencyEntity.validateCode(payload.reportingCurrency.code);
  helpers.validateType(payload.type);
  helpers.validateFiscalYearStart(payload.fiscalYearStart);

  const timestamp = new Date();

  const domain: IAccountingEntity = Object.freeze({
    id: generateUUID(),
    name: payload.name.trim(),
    operatingCountryCode: payload.operatingCountryCode,
    accountingContextId: payload.accountingContextId,
    ownerId: payload.ownerId,
    type: payload.type,
    functionalCurrency: payload.functionalCurrency,
    reportingCurrency: payload.reportingCurrency,
    fiscalYearStart: Object.freeze({ ...payload.fiscalYearStart }),
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  });

  const event = accountingEntityEvents.created(domain);

  return [domain, [event]];
}

const accountingEntityEntity = Object.freeze({
  make,

  ...helpers,
});

export default accountingEntityEntity;
