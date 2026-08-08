import { omit } from 'lodash';
import z from 'zod';

import { paginationDtoValidation } from '@shared/values/pagination/dto/pagination.dto.validation';
import paginationError from '@shared/values/pagination/pagination.error';

import counterpartyError from '@domain/counterparty/errors/counterparty.error';
import {
  ECounterpartySortBy,
  UCounterpartySortBy,
} from '@domain/counterparty/repos/counterparty.repo';
import {
  ECounterpartyRole,
  ECounterpartyStatus,
  ECounterpartyType,
  UCounterpartyRole,
  UCounterpartyStatus,
  UCounterpartyType,
} from '@domain/counterparty/types/counterparty.types';

const invalidNameKey = new counterpartyError.InvalidName().errorKey;
const invalidTypeKey = new counterpartyError.InvalidType().errorKey;
const invalidStatusKey = new counterpartyError.InvalidStatus().errorKey;
const invalidRoleKey = new counterpartyError.InvalidRole().errorKey;
const invalidOrderByKey = new paginationError.InvalidOrderBy().errorKey;

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

export const counterpartyRoleValidation = z.enum(
  Object.values(ECounterpartyRole) as [
    UCounterpartyRole,
    ...UCounterpartyRole[],
  ],
  invalidRoleKey
);

export const counterpartyOrderByValidationSchema = z.enum(
  Object.values(ECounterpartySortBy) as [
    UCounterpartySortBy,
    ...UCounterpartySortBy[],
  ],
  invalidOrderByKey
);

export const counterpartyNameValidation = z
  .string(invalidNameKey)
  .trim()
  .min(1, invalidNameKey)
  .max(255, invalidNameKey);

export const counterpartyCreateReqValidation = z.object({
  name: counterpartyNameValidation,
  status: counterpartyStatusValidation,
  type: counterpartyTypeValidation,
});

export const getCounterpartiesQueryValidationSchema = z.object({
  ...omit(paginationDtoValidation.shape, ['orderBy']),
  roles: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      return Array.isArray(val) ? val : [val];
    }, z.array(counterpartyRoleValidation).optional())
    .optional(),
  type: counterpartyTypeValidation.optional(),
  status: counterpartyStatusValidation.optional(),
  orderBy: counterpartyOrderByValidationSchema.optional(),
});
