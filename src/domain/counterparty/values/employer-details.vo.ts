import {
  IEmployerDetails,
  IMakeEmployerDetailsPayload,
} from '../types/counterparty.types';
import helpers from './helpers/counterparty-value.helpers';

function make(
  payload: IMakeEmployerDetailsPayload
): Readonly<IEmployerDetails> {
  helpers.validateCounterpartyId(payload.counterPartyId);
  const displayName = helpers.sanitizeDisplayName(payload.displayName);
  const address = helpers.validateAddress(payload.address, true)!;

  const employerDetails: IEmployerDetails = {
    counterPartyId: payload.counterPartyId,
    displayName,
    address,
    createdAt: new Date(),
  };

  return Object.freeze(employerDetails);
}

const employerDetailsValue = Object.freeze({
  make,
  validateCounterpartyId: helpers.validateCounterpartyId,
  validateAddress: helpers.validateAddress,
  sanitizeDisplayName: helpers.sanitizeDisplayName,
});

export default employerDetailsValue;
