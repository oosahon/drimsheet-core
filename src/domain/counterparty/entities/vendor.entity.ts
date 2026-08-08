import { TAuditedEntity } from '@shared/values/events/types/event.types';

import vendorEvents from '@domain/counterparty/events/vendor.events';
import { EVendorHistoryAction } from '@domain/counterparty/types/counterparty-audit.types';
import {
  IMakeVendorPayload,
  IVendor,
} from '@domain/counterparty/types/counterparty.types';
import helpers from '@domain/counterparty/values/helpers/counterparty-value.helpers';
import vendorAuditValue from '@domain/counterparty/values/vendor-audit.vo';

function make(
  payload: IMakeVendorPayload
): TAuditedEntity<IVendor, IVendor, IVendor> {
  helpers.validateCounterpartyId(payload.counterpartyId);
  const address = helpers.validateAddress(payload.address, false);

  const vendor: IVendor = Object.freeze({
    counterpartyId: payload.counterpartyId,
    address,
    createdAt: new Date(),
  });

  const event = vendorEvents.created(vendor);

  const audit = vendorAuditValue.make({
    before: null,
    after: vendor,
    action: EVendorHistoryAction.Created,
  });

  return [vendor, [event], audit] as const;
}

function update(
  before: IVendor,
  payload: Omit<IMakeVendorPayload, 'counterpartyId'>
): TAuditedEntity<IVendor, IVendor, IVendor> {
  const address = helpers.validateAddress(payload.address, false);

  const updatedVendor: IVendor = Object.freeze({
    counterpartyId: before.counterpartyId,
    address,
    createdAt: before.createdAt,
  });

  const event = vendorEvents.updated(updatedVendor);

  const audit = vendorAuditValue.make({
    before,
    after: updatedVendor,
    action: EVendorHistoryAction.Updated,
  });

  return [updatedVendor, [event], audit] as const;
}

const vendorEntity = Object.freeze({
  make,
  update,
  validateCounterpartyId: helpers.validateCounterpartyId,
  validateAddress: helpers.validateAddress,
});

export default vendorEntity;
