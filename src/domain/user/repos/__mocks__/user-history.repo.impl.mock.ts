import IUserHistoryRepo from '../user-history.repo';

const mockUserHistoryRepo: jest.Mocked<IUserHistoryRepo> = {
  save: jest.fn(),
};

export default mockUserHistoryRepo;
