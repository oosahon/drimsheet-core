import IUserRepo from '../../../domain/user/repos/user.repo';
import { ICorrelationId } from '../../../shared/types/correlation-id.types';

export interface ITransactionContext {
  _brand?: 'PurpleLedgerTransactionContext';
}

export interface IRepoOptions extends ICorrelationId {
  tx?: ITransactionContext;
  selectingForUpdate?: boolean;
}

export interface IRepoService {
  runInTransaction<T>(fn: (tx: ITransactionContext) => Promise<T>): Promise<T>;
}
