import {
  IMakeVendorDetailsPayload,
  IVendorDetails,
} from '../types/counterparty.types';
import helpers from './helpers/counterparty-value.helpers';

function make(payload: IMakeVendorDetailsPayload): Readonly<IVendorDetails> {
  helpers.validateCounterpartyId(payload.counterPartyId);
  const address = helpers.validateAddress(payload.address, false);

  const vendorDetails: IVendorDetails = {
    counterPartyId: payload.counterPartyId,
    address,
    createdAt: new Date(),
  };

  return Object.freeze(vendorDetails);
}

const vendorDetailsValue = Object.freeze({
  make,
  validateCounterpartyId: helpers.validateCounterpartyId,
  validateAddress: helpers.validateAddress,
});

export default vendorDetailsValue;
