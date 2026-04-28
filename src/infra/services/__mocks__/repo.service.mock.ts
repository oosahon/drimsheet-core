import { IRepoService } from '../../../app/contracts/infra/repo.contract';
import { ITransactionContext } from '../../../shared/types/repo.types';

const mockRepoService = {
  runInTransaction: jest.fn(
    async (cb: (tx: ITransactionContext) => Promise<any>) => {
      return await cb('mock-tx' as unknown as ITransactionContext);
    }
  ),
} as unknown as jest.Mocked<IRepoService>;

export default mockRepoService;
