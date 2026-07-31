import {
  IContractorDetails,
  IMakeContractorDetailsPayload,
} from '../types/counterparty.types';
import helpers from './helpers/counterparty-value.helpers';

function make(
  payload: IMakeContractorDetailsPayload
): Readonly<IContractorDetails> {
  helpers.validateCounterpartyId(payload.counterPartyId);
  const address = helpers.validateAddress(payload.address, true)!;

  const contractorDetails: IContractorDetails = {
    counterPartyId: payload.counterPartyId,
    address,
    createdAt: new Date(),
  };

  return Object.freeze(contractorDetails);
}

const contractorDetailsValue = Object.freeze({
  make,
  validateCounterpartyId: helpers.validateCounterpartyId,
  validateAddress: helpers.validateAddress,
});

export default contractorDetailsValue;
