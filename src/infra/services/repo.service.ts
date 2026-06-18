import { IRepoService } from '../../shared/contracts/repo.contract';
import { ITransactionContext } from '../../shared/types/repo.types';
import { postgres } from '../config/postgres.config';

const repoService: IRepoService = {
  async runInTransaction(fn, tx) {
    if (tx) {
      return await fn(tx);
    }

    return await postgres.transaction(async (tx) => {
      return await fn(tx as ITransactionContext);
    });
  },
};

export default repoService;
