import { IRepoService } from '@shared/contracts/repo.contract';

const mockRepoService: jest.Mocked<IRepoService> = {
  runInTransaction: jest.fn(),
};

export default mockRepoService;
