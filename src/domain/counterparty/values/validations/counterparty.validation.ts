import { TEntityId } from '@shared/types/uuid';
import stringUtils from '@shared/utils/string';
import addressValue from '@shared/values/contact-details/address.vo';
import { IAddress } from '@shared/values/contact-details/types/address.types';

import counterpartyError from '@domain/counterparty/errors/counterparty.error';

function validateCounterpartyId(counterpartyId: TEntityId): void {
  stringUtils.validateUUID(
    counterpartyId,
    counterpartyError.InvalidCounterpartyId
  );
}

function validateAddress(
  address: IAddress | null | undefined,
  isRequired: boolean
): IAddress | null {
  if (!address) {
    if (isRequired) {
      throw new counterpartyError.InvalidAddress({ address });
    }
    return null;
  }

  addressValue.validate(address);
  return address;
}

function sanitizeDisplayName(displayName?: string | null): string | null {
  if (
    displayName === undefined ||
    displayName === null ||
    !stringUtils.isNonEmptyString(displayName)
  ) {
    return null;
  }

  return stringUtils.sanitizeAndValidate(
    displayName,
    { min: 1, max: 255 },
    counterpartyError.InvalidName
  );
}

const counterpartyValidation = Object.freeze({
  validateCounterpartyId,
  validateAddress,
  sanitizeDisplayName,
});

export default counterpartyValidation;
