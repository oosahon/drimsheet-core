import { TAuditedEntity } from '@shared/values/events/types/event.types';

import contractorEvents from '@domain/counterparty/events/contractor.events';
import { EContractorHistoryAction } from '@domain/counterparty/types/counterparty-audit.types';
import {
  IContractor,
  IMakeContractorPayload,
} from '@domain/counterparty/types/counterparty.types';
import contractorAuditValue from '@domain/counterparty/values/contractor-audit.vo';
import counterpartyValidation from '@domain/counterparty/values/validations/counterparty.validation';

function make(
  payload: IMakeContractorPayload
): TAuditedEntity<IContractor, IContractor, IContractor> {
  counterpartyValidation.validateCounterpartyId(payload.counterpartyId);
  const address = counterpartyValidation.validateAddress(
    payload.address,
    true
  )!;

  const contractor: IContractor = Object.freeze({
    counterpartyId: payload.counterpartyId,
    address,
    createdAt: new Date(),
  });

  const event = contractorEvents.created(contractor);

  const audit = contractorAuditValue.make({
    before: null,
    after: contractor,
    action: EContractorHistoryAction.Created,
  });

  return [contractor, [event], audit] as const;
}

function update(
  before: IContractor,
  payload: Omit<IMakeContractorPayload, 'counterpartyId'>
): TAuditedEntity<IContractor, IContractor, IContractor> {
  const address = counterpartyValidation.validateAddress(
    payload.address,
    true
  )!;

  const updatedContractor: IContractor = Object.freeze({
    counterpartyId: before.counterpartyId,
    address,
    createdAt: before.createdAt,
  });

  const event = contractorEvents.updated(updatedContractor);

  const audit = contractorAuditValue.make({
    before,
    after: updatedContractor,
    action: EContractorHistoryAction.Updated,
  });

  return [updatedContractor, [event], audit] as const;
}

const contractorEntity = Object.freeze({
  make,
  update,
});

export default contractorEntity;
