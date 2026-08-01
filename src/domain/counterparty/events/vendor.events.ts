import eventValue from '../../../shared/values/events/event.vo';
import { IVendor } from '../types/counterparty.types';

export const EVendorEvents = {
  Created: 'domain:counterparty:vendor:created',
  Updated: 'domain:counterparty:vendor:updated',
} as const;

function makeCreatedEvent(vendor: IVendor) {
  return eventValue.make<IVendor>({
    type: EVendorEvents.Created,
    data: vendor,
  });
}

function makeUpdatedEvent(vendor: IVendor) {
  return eventValue.make<IVendor>({
    type: EVendorEvents.Updated,
    data: vendor,
  });
}

const vendorEvents = Object.freeze({
  created: makeCreatedEvent,
  updated: makeUpdatedEvent,
});

export default vendorEvents;
