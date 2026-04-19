import { ICorrelationId } from '../../../shared/types/correlation-id.types';

export interface ITransactionContext {
  _brand?: 'PurpleLedgerTransactionContext';
}

export interface IRepoOptions extends ICorrelationId {
  tx?: ITransactionContext;
  lock?: 'update' | 'no key update' | 'share' | 'key share';
  expectedVersion?: number;
}

export type TRepoTransactionFn<T = void> = (
  tx: ITransactionContext
) => Promise<T>;

export interface IRepoService {
  runInTransaction<T>(fn: TRepoTransactionFn<T>): Promise<T>;
}
