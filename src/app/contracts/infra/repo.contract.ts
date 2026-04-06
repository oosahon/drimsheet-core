import { ICorrelationId } from '../../../shared/types/correlation-id.types';

export interface ITransactionContext {
  _brand?: 'PurpleLedgerTransactionContext';
}

export interface IRepoOptions extends ICorrelationId {
  tx?: ITransactionContext;
}

export interface IRepoService {
  runInTransaction<T>(fn: (tx: ITransactionContext) => Promise<T>): Promise<T>;
}
