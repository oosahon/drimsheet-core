import deepFreeze from '@shared/utils/deep-freeze';
import addressValue from '@shared/values/contact-details/address.vo';

import {
  ICounterpartyEmployerMeta,
  ICreateCounterpartyEmployerMeta,
} from '@domain/counterparty/types/counterparty.types';
import counterpartyMetaValidation from '@domain/counterparty/values/validations/counterparty-meta.validation';
import counterpartyValidation from '@domain/counterparty/values/validations/counterparty.validation';

function make(
  payload: ICreateCounterpartyEmployerMeta
): Readonly<ICounterpartyEmployerMeta> {
  counterpartyMetaValidation.validateCreate({ employer: payload });
  const meta = {
    displayName: counterpartyValidation.sanitizeDisplayName(
      payload.displayName
    ),
    address: addressValue.make(payload.address),
  };
  counterpartyMetaValidation.validate({ employer: meta });
  return deepFreeze({
    displayName: meta.displayName,
    address: meta.address,
  });
}

const employerMetaValue = Object.freeze({ make });
export default employerMetaValue;
