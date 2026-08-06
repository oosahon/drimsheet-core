import generateUUID from '../../../shared/utils/uuid-generator';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import counterpartyError from '../errors/counterparty.error';
import counterpartyEvents from '../events/counterparty.events';
import { ECounterpartyEntityActions } from '../types/counterparty-audit.types';
import {
  ECounterpartyStatus,
  ICounterparty,
  IMakeCounterpartyPayload,
  TAuditedCounterparty,
  UCounterpartyRole,
} from '../types/counterparty.types';
import counterpartyAuditValue from '../values/counterparty-audit.vo';
import helpers from './helpers/counterparty.entity.helpers';

function make(payload: IMakeCounterpartyPayload): TAuditedCounterparty {
  helpers.validateAccountingEntityId(payload.accountingEntityId);
  const name = helpers.validateName(payload.name);
  const type = helpers.validateType(payload.type);
  const status = payload.status
    ? helpers.validateStatus(payload.status)
    : ECounterpartyStatus.Active;

  const timestamp = new Date();

  const counterparty: ICounterparty = Object.freeze({
    id: generateUUID(),
    accountingEntityId: payload.accountingEntityId,
    name,
    status,
    type,
    roles: Object.freeze([]) as unknown as UCounterpartyRole[],
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
  role: UCounterpartyRole
): TAuditedEntity<ICounterparty, ICounterparty, ICounterparty> {
  helpers.validateCounterparty(counterparty);
  helpers.validateRole(role);

  if (counterparty.roles.includes(role)) {
    throw new counterpartyError.RoleAlreadyAssigned({
      role,
      counterpartyId: counterparty.id,
    });
  }

  const timestamp = new Date();

  const updatedCounterparty: ICounterparty = Object.freeze({
    id: counterparty.id,
    accountingEntityId: counterparty.accountingEntityId,
    name: counterparty.name,
    status: counterparty.status,
    type: counterparty.type,
    roles: Object.freeze(
      counterparty.roles.concat(role)
    ) as unknown as UCounterpartyRole[],
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

const counterpartyEntity = Object.freeze({
  make,
  addRole,
  ...helpers,
});

export default counterpartyEntity;
