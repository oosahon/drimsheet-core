import {
  IRepoService,
  ITransactionContext,
} from '../../../app/contracts/infra/repo.contract';

const mockDbService = {
  runInTransaction: jest.fn((_: (tx: ITransactionContext) => Promise<any>) =>
    Promise.resolve()
  ),
} as jest.Mocked<IRepoService>;

export default mockDbService;
