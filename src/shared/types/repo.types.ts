import { ICorrelationId } from './correlation-id.types';
import { IPaginationParams } from './pagination.types';

export interface ITransactionContext {
  _brand?: 'PurpleLedgerTransactionContext';
}

export interface IRepoOptions extends ICorrelationId, IPaginationParams {
  tx?: ITransactionContext;
  lock?: 'update' | 'no key update' | 'share' | 'key share';
  expectedVersion?: number;
}
