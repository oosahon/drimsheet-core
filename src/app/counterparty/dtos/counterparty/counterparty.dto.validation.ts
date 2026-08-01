import z from 'zod';
import counterpartyError from '../../../../domain/counterparty/errors/counterparty.error';
import {
  ECounterpartyStatus,
  ECounterpartyType,
  UCounterpartyStatus,
  UCounterpartyType,
} from '../../../../domain/counterparty/types/counterparty.types';

const invalidAccountingEntityIdKey =
  new counterpartyError.InvalidAccountingEntityId().errorKey;
const invalidCounterpartyIdKey = new counterpartyError.InvalidCounterpartyId()
  .errorKey;
const invalidNameKey = new counterpartyError.InvalidName().errorKey;
const invalidTypeKey = new counterpartyError.InvalidType().errorKey;
const invalidStatusKey = new counterpartyError.InvalidStatus().errorKey;
const invalidDateKey = new counterpartyError.InvalidDate().errorKey;

export const counterpartyStatusValidation = z.enum(
  Object.values(ECounterpartyStatus) as [
    UCounterpartyStatus,
    ...UCounterpartyStatus[],
  ],
  invalidStatusKey
);

export const counterpartyTypeValidation = z.enum(
  Object.values(ECounterpartyType) as [
    UCounterpartyType,
    ...UCounterpartyType[],
  ],
  invalidTypeKey
);

export const counterpartyCreateReqValidation = z.object({
  id: z.uuid(invalidCounterpartyIdKey),
  name: z
    .string(invalidNameKey)
    .trim()
    .min(1, invalidNameKey)
    .max(255, invalidNameKey),
  status: counterpartyStatusValidation,
  type: counterpartyTypeValidation,
  createdAt: z.date(invalidDateKey),
  updatedAt: z.date(invalidDateKey),
});
