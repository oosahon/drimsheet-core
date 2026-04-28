import { UAccountingEntityType } from '../../accounting-entity/types/accounting-entity.types';
import { ICurrency } from '../../currency/types/currency.types';
import { UAccountingStandardCode } from '../config/accounting-standards.config';

export interface IJurisdiction {
  code: string;
  name: string;
  currency: ICurrency;
  accountingStandards: Record<UAccountingEntityType, UAccountingStandardCode[]>;
}
