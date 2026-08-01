import z from 'zod';
import counterpartyError from '../../../../domain/counterparty/errors/counterparty.error';
import { addressDtoValidation } from '../../../../shared/values/contact-details/dto/address.dto.validation';
import {
  counterpartyNameValidation,
  counterpartyStatusValidation,
  counterpartyTypeValidation,
} from '../counterparty/counterparty.dto.validation';

const invalidNameKey = new counterpartyError.InvalidName().errorKey;

export const employerCreateReqValidation = z.object({
  name: counterpartyNameValidation,
  status: counterpartyStatusValidation,
  type: counterpartyTypeValidation,
  displayName: z
    .string(invalidNameKey)
    .trim()
    .max(255, invalidNameKey)
    .nullish(),
  address: addressDtoValidation,
});
