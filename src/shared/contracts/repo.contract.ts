import { ITransactionContext } from '@shared/types/repo.types';

export type TRepoTransactionFn<T = void> = (
  tx: ITransactionContext
) => Promise<T>;

export interface IRepoService {
  runInTransaction<T>(
    fn: TRepoTransactionFn<T>,
    tx?: ITransactionContext
  ): Promise<T>;
}
