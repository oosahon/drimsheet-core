import deepFreeze from '@shared/utils/deep-freeze';
import generateUUID from '@shared/utils/uuid-generator';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import getCounterpartyRolesHelper from '@domain/counterparty/entities/helpers/get-counterparty-roles.helper';
import counterpartyValidation from '@domain/counterparty/entities/validations/counterparty.validation';
import counterpartyError from '@domain/counterparty/errors/counterparty.error';
import counterpartyEvents from '@domain/counterparty/events/counterparty.events';
import { ECounterpartyEntityActions } from '@domain/counterparty/types/counterparty-audit.types';
import {
  ECounterpartyStatus,
  ICounterparty,
  IMakeCounterpartyPayload,
  TAuditedCounterparty,
  TCounterpartyRoleDetails,
} from '@domain/counterparty/types/counterparty.types';
import counterpartyAuditValue from '@domain/counterparty/values/counterparty-audit.vo';
import counterpartyMetaValidation from '@domain/counterparty/values/validations/counterparty-meta.validation';

function make(payload: IMakeCounterpartyPayload): TAuditedCounterparty {
  counterpartyValidation.validateAccountingEntityId(payload.accountingEntityId);
  const name = counterpartyValidation.validateName(payload.name);
  const type = counterpartyValidation.validateType(payload.type);
  const status = payload.status
    ? counterpartyValidation.validateStatus(payload.status)
    : ECounterpartyStatus.Active;

  const timestamp = new Date();

  const counterparty: ICounterparty = deepFreeze({
    id: generateUUID(),
    accountingEntityId: payload.accountingEntityId,
    name,
    status,
    type,
    roles: [],
    meta: {},
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const event = counterpartyEvents.created(counterparty);

  const audit = counterpartyAuditValue.make({
    before: null,
    after: counterparty,
    action: ECounterpartyEntityActions.Created,
  });

  return [counterparty, [event], audit] as const;
}

function addRole(
  counterparty: ICounterparty,
  details: TCounterpartyRoleDetails
): TAuditedEntity<ICounterparty, ICounterparty, ICounterparty> {
  counterpartyValidation.validateCounterparty(counterparty);
  const { role } = details;
  counterpartyValidation.validateRole(role);

  if (counterparty.roles.includes(role)) {
    throw new counterpartyError.RoleAlreadyAssigned({
      role,
      counterpartyId: counterparty.id,
    });
  }

  const meta = {
    ...counterparty.meta,
    [role]: details.meta,
  };
  counterpartyMetaValidation.validate(meta);
  const timestamp = new Date();

  const updatedCounterparty: ICounterparty = deepFreeze({
    id: counterparty.id,
    accountingEntityId: counterparty.accountingEntityId,
    name: counterparty.name,
    status: counterparty.status,
    type: counterparty.type,
    roles: getCounterpartyRolesHelper(meta),
    meta,
    createdAt: counterparty.createdAt,
    updatedAt: timestamp,
  });

  const event = counterpartyEvents.roleAdded(updatedCounterparty);

  const audit = counterpartyAuditValue.make({
    before: counterparty,
    after: updatedCounterparty,
    action: ECounterpartyEntityActions.RoleAdded,
  });

  return [updatedCounterparty, [event], audit] as const;
}

const counterpartyEntity = deepFreeze({
  make,
  addRole,
  ...counterpartyValidation,
});

export default counterpartyEntity;
