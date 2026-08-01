import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import contractorEvents from '../events/contractor.events';
import { EContractorHistoryAction } from '../types/counterparty-audit.types';
import {
  IContractor,
  IMakeContractorPayload,
} from '../types/counterparty.types';
import contractorAuditValue from '../values/contractor-audit.vo';
import helpers from '../values/helpers/counterparty-value.helpers';

function make(
  payload: IMakeContractorPayload
): TAuditedEntity<IContractor, IContractor, IContractor> {
  helpers.validateCounterpartyId(payload.counterPartyId);
  const address = helpers.validateAddress(payload.address, true)!;

  const contractor: IContractor = Object.freeze({
    counterPartyId: payload.counterPartyId,
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
  payload: Omit<IMakeContractorPayload, 'counterPartyId'>
): TAuditedEntity<IContractor, IContractor, IContractor> {
  const address = helpers.validateAddress(payload.address, true)!;

  const updatedContractor: IContractor = Object.freeze({
    counterPartyId: before.counterPartyId,
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
  validateCounterpartyId: helpers.validateCounterpartyId,
  validateAddress: helpers.validateAddress,
});

export default contractorEntity;
