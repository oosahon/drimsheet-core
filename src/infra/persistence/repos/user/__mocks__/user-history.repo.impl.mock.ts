import IUserHistoryRepo from '../../../../../domain/user/repos/user-history.repo';

const mockUserHistoryRepo: jest.Mocked<IUserHistoryRepo> = {
  save: jest.fn(),
};

export default mockUserHistoryRepo;
