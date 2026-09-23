import deepFreeze from '@shared/utils/deep-freeze';
import addressValue from '@shared/values/contact-details/address.vo';

import {
  ICounterpartyContractorMeta,
  ICreateCounterpartyContractorMeta,
} from '@domain/counterparty/types/counterparty.types';
import counterpartyMetaValidation from '@domain/counterparty/values/validations/counterparty-meta.validation';

function make(
  payload: ICreateCounterpartyContractorMeta
): Readonly<ICounterpartyContractorMeta> {
  counterpartyMetaValidation.validateCreate({ contractor: payload });
  const meta = {
    address: addressValue.make(payload.address),
  };
  counterpartyMetaValidation.validate({ contractor: meta });
  return deepFreeze(meta);
}

const contractorMetaValue = Object.freeze({ make });
export default contractorMetaValue;
