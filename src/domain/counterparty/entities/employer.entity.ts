import { TAuditedEntity } from '@shared/values/events/types/event.types';

import employerEvents from '@domain/counterparty/events/employer.events';
import { EEmployerHistoryAction } from '@domain/counterparty/types/counterparty-audit.types';
import {
  IEmployer,
  IMakeEmployerPayload,
} from '@domain/counterparty/types/counterparty.types';
import employerAuditValue from '@domain/counterparty/values/employer-audit.vo';
import counterpartyValidation from '@domain/counterparty/values/validations/counterparty.validation';

function make(
  payload: IMakeEmployerPayload
): TAuditedEntity<IEmployer, IEmployer, IEmployer> {
  counterpartyValidation.validateCounterpartyId(payload.counterpartyId);
  const displayName = counterpartyValidation.sanitizeDisplayName(
    payload.displayName
  );
  const address = counterpartyValidation.validateAddress(
    payload.address,
    true
  )!;

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
  const displayName = counterpartyValidation.sanitizeDisplayName(
    payload.displayName
  );
  const address = counterpartyValidation.validateAddress(
    payload.address,
    true
  )!;

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
});

export default employerEntity;
