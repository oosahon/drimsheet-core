import z from 'zod';
import {
  SYSTEM_JURISDICTIONS,
  UJurisdictionCode,
} from '../../../domain/accounting/config/jurisdictions.config';
import {
  EAccountingEntityType,
  UAccountingEntityType,
} from '../../../domain/accounting/types/accounting-entity.types';

export const jurisdictionCodeValidation = z.enum(
  Object.keys(SYSTEM_JURISDICTIONS) as [
    UJurisdictionCode,
    ...UJurisdictionCode[],
  ],
  'Unsupported operating country code'
);

export const accountingEntityTypeValidation = z.enum(
  Object.values(EAccountingEntityType) as [
    UAccountingEntityType,
    ...UAccountingEntityType[],
  ],
  'Unsupported accounting entity type'
);

export const periodMonthValidation = z.number().min(1).max(12);
export const periodDayValidation = z.number().min(1).max(31);
