import { ICurrency } from '../../money/types/currency.types';
import { UAccountingStandardCode } from '../config/accounting-standards.config';
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
