import deepFreeze from '@shared/utils/deep-freeze';
import addressValue from '@shared/values/contact-details/address.vo';

import {
  ICounterpartyVendorMeta,
  ICreateCounterpartyVendorMeta,
} from '@domain/counterparty/types/counterparty.types';
import counterpartyMetaValidation from '@domain/counterparty/values/validations/counterparty-meta.validation';

function make(
  payload: ICreateCounterpartyVendorMeta
): Readonly<ICounterpartyVendorMeta> {
  counterpartyMetaValidation.validateCreate({ vendor: payload });
  const meta = {
    address:
      payload.address == null ? null : addressValue.make(payload.address),
  };
  counterpartyMetaValidation.validate({ vendor: meta });
  return deepFreeze(meta);
}

const vendorMetaValue = Object.freeze({ make });
export default vendorMetaValue;
