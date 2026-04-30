import { ICorrelationId } from './correlation-id.types';

export interface ITransactionContext {
  _brand?: 'PurpleLedgerTransactionContext';
}

export interface IRepoOptions<T = object> extends ICorrelationId {
  tx?: ITransactionContext;
  lock?: 'update' | 'no key update' | 'share' | 'key share';
  expectedVersion?: number;
  orderBy?: Partial<Record<keyof T, 'asc' | 'desc'>>;
  limit?: number;
}
