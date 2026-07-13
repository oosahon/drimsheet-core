import { ITransactionContext } from '../../../shared/types/repo.types';
import { IRepoService } from '../repo.contract';

const mockRepoService = {
  runInTransaction: jest.fn(
    async (cb: (tx: ITransactionContext) => Promise<any>) => {
      return await cb('mock-tx' as unknown as ITransactionContext);
    }
  ),
} as unknown as jest.Mocked<IRepoService>;

export default mockRepoService;
