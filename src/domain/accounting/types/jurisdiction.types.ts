import { ICurrency } from '../../currency/types/currency.types';
import { UAccountingStandardCode } from '../config/accounting-standards.config';
import { UAccountingEntityType } from './accounting-entity.types';

export interface IJurisdiction {
  code: string;
  name: string;
  currency: ICurrency;
  accountingStandards: Record<UAccountingEntityType, UAccountingStandardCode[]>;
}

export interface IJurisdictionAccountingStandard {
  jurisdictionCode: string;
  accountingStandardCode: string;
  accountingEntityType: string;
}
