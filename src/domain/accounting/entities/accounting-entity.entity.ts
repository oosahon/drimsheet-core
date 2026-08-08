import { TCreationOmits } from '@shared/types/creation-omits.types';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import helpers from '@domain/accounting/entities/helpers/accounting-entity.entity.helpers';
import accountingError from '@domain/accounting/errors/accounting.error';
import accountingEntityEvents from '@domain/accounting/events/accounting-entity.events';
import { EAccountingEntityActions } from '@domain/accounting/types/accounting-entity-audit.types';
import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import accountingEntityAudit from '@domain/accounting/values/accounting-entity-audit.vo';
import currencyEntity from '@domain/money/entities/currency.entity';

function make(
  payload: TCreationOmits<IAccountingEntity>
): TAuditedEntity<IAccountingEntity, IAccountingEntity, IAccountingEntity> {
  helpers.validateType(payload.type);
  stringUtils.validateUUID(payload.ownerId, accountingError.InvalidValue);
  currencyEntity.validateCode(payload.functionalCurrencyCode);
  helpers.validateJurisdictionCode(payload.jurisdictionCode);

  const name = stringUtils.sanitizeAndValidate(
    payload.name,
    {
      min: 1,
      max: 100,
    },
    accountingError.InvalidValue
  );

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

  const audit = accountingEntityAudit.make({
    before: null,
    after: entity,
    action: EAccountingEntityActions.Created,
  });

  return [entity, [events], audit];
}

const accountingEntityEntity = Object.freeze({
  make,

  ...helpers,
});

export default accountingEntityEntity;
