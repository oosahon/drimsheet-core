import { IRepoService } from '../../../app/contracts/infra/repo.contract';

const mockDbService: jest.Mocked<IRepoService> = {
  runInTransaction: jest.fn(),
};

export default mockDbService;
