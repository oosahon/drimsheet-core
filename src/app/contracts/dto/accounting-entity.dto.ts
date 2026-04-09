import { IAccountingEntity } from '../../../domain/accounting/types/accounting.types';

export interface IAccountingEntityRes extends Omit<
  IAccountingEntity,
  'functionalCurrency' | 'reportingCurrency'
> {
  functionalCurrency: string;
  reportingCurrency: string;
}
