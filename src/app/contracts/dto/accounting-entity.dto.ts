import { IAccountingEntity } from '../../../domain/accounting-entity/types/accounting-entity.types';

export interface IAccountingEntityRes extends Omit<
  IAccountingEntity,
  'functionalCurrency' | 'reportingCurrency'
> {
  functionalCurrency: string;
  reportingCurrency: string;
}
