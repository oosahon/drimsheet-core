import { IRepoService } from '../../shared/contracts/repo.contract';
import { ITransactionContext } from '../../shared/types/repo.types';
import { postgres } from '../config/postgres.config';

const repoService: IRepoService = {
  async runInTransaction<T>(
    fn: (tx: ITransactionContext) => Promise<T>
  ): Promise<T> {
    return await postgres.transaction(async (tx) => {
      return await fn(tx as ITransactionContext);
    });
  },
};

export default repoService;
