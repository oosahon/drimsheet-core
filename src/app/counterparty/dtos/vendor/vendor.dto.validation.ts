import z from 'zod';
import { addressDtoValidation } from '../../../../shared/values/contact-details/dto/address.dto.validation';
import {
  counterpartyNameValidation,
  counterpartyStatusValidation,
  counterpartyTypeValidation,
} from '../counterparty/counterparty.dto.validation';

export const vendorCreateReqValidation = z.object({
  name: counterpartyNameValidation,
  status: counterpartyStatusValidation,
  type: counterpartyTypeValidation,
  address: addressDtoValidation.optional(),
});
