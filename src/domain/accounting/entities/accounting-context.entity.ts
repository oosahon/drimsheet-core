import { TCreationOmits } from '@shared/types/creation-omits.types';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import helpers from '@domain/accounting/entities/helpers/accounting-context.entity.helpers';
import accountingError from '@domain/accounting/errors/accounting.error';
import accountingContextEvents from '@domain/accounting/events/accounting-context.events';
import { EAccountingContextActions } from '@domain/accounting/types/accounting-context-audit.types';
import { IAccountingContext } from '@domain/accounting/types/context.types';
import accountingContextAudit from '@domain/accounting/values/accounting-context-audit.vo';

function make(
  payload: TCreationOmits<IAccountingContext, 'closedAt'>
): TAuditedEntity<IAccountingContext, IAccountingContext, IAccountingContext> {
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

  const audit = accountingContextAudit.make({
    before: null,
    after: entity,
    action: EAccountingContextActions.Created,
  });

  return [entity, [events], audit];
}

const accountingContextEntity = Object.freeze({
  make,

  ...helpers,
});

export default accountingContextEntity;
