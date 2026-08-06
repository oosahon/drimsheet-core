import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import employerEvents from '../events/employer.events';
import { EEmployerHistoryAction } from '../types/counterparty-audit.types';
import { IEmployer, IMakeEmployerPayload } from '../types/counterparty.types';
import employerAuditValue from '../values/employer-audit.vo';
import helpers from '../values/helpers/counterparty-value.helpers';

function make(
  payload: IMakeEmployerPayload
): TAuditedEntity<IEmployer, IEmployer, IEmployer> {
  helpers.validateCounterpartyId(payload.counterpartyId);
  const displayName = helpers.sanitizeDisplayName(payload.displayName);
  const address = helpers.validateAddress(payload.address, true)!;

  const employer: IEmployer = Object.freeze({
    counterpartyId: payload.counterpartyId,
    displayName,
    address,
    createdAt: new Date(),
  });

  const event = employerEvents.created(employer);

  const audit = employerAuditValue.make({
    before: null,
    after: employer,
    action: EEmployerHistoryAction.Created,
  });

  return [employer, [event], audit] as const;
}

function update(
  before: IEmployer,
  payload: Omit<IMakeEmployerPayload, 'counterpartyId'>
): TAuditedEntity<IEmployer, IEmployer, IEmployer> {
  const displayName = helpers.sanitizeDisplayName(payload.displayName);
  const address = helpers.validateAddress(payload.address, true)!;

  const updatedEmployer: IEmployer = Object.freeze({
    counterpartyId: before.counterpartyId,
    displayName,
    address,
    createdAt: before.createdAt,
  });

  const event = employerEvents.updated(updatedEmployer);

  const audit = employerAuditValue.make({
    before,
    after: updatedEmployer,
    action: EEmployerHistoryAction.Updated,
  });

  return [updatedEmployer, [event], audit] as const;
}

const employerEntity = Object.freeze({
  make,
  update,
  validateCounterpartyId: helpers.validateCounterpartyId,
  validateAddress: helpers.validateAddress,
  sanitizeDisplayName: helpers.sanitizeDisplayName,
});

export default employerEntity;
