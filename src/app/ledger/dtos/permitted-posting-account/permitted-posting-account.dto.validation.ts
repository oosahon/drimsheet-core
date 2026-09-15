import z from 'zod';

import appError from '@shared/values/errors/app.error';
import { paginationDtoValidation } from '@shared/values/pagination/dto/pagination.dto.validation';

import currencyEntity from '@domain/money/entities/currency.entity';
import currencyError from '@domain/money/errors/currency.error';

import { journalEntrySourceTypeValidation } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.validation';
import { currencyCodeValidation } from '@app/money/dtos/currency/currency.dto.validation';

const invalidSideKey = new appError.UnprocessableEntity([]).errorKey;
const invalidCurrencyCodeKey = new currencyError.InvalidCode().errorKey;

const permittedPostingAccountSideValidation = z.enum(
  ['source', 'destination'],
  invalidSideKey
);

const permittedPostingAccountCurrencyValidation = currencyCodeValidation.refine(
  (currencyCode) =>
    currencyEntity.isValidCode(currencyEntity.normalizeCode(currencyCode)),
  invalidCurrencyCodeKey
);

export const getPermittedPostingAccountsQueryValidationSchema = z.object({
  sourceType: journalEntrySourceTypeValidation,
  side: permittedPostingAccountSideValidation,
  filterSuspense: z.boolean().optional(),
  currencyCode: permittedPostingAccountCurrencyValidation.optional(),
  page: paginationDtoValidation.shape.page,
  limit: paginationDtoValidation.shape.limit,
});
