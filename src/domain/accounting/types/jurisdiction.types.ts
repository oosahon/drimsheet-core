import { UAccountingStandardCode } from '@domain/accounting/config/accounting-standards.config';
import { ICurrency } from '@domain/money/types/currency.types';

import { UAccountingEntityType } from './accounting-entity.types';

export interface IJurisdiction {
  code: string;
  name: string;
  currency: ICurrency;
  accountingStandards: Record<UAccountingEntityType, UAccountingStandardCode[]>;
  maxFiscalMonths: number;
}

export interface IJurisdictionAccountingStandard {
  jurisdictionCode: string;
  accountingStandardCode: string;
  accountingEntityType: string;
}
