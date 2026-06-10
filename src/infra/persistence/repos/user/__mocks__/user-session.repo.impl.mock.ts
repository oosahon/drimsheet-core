import IUserSessionRepo from '../../../../../app/auth/contracts/user-session.repo.contract';

const mockUserSessionRepo: jest.Mocked<IUserSessionRepo> = {
  save: jest.fn(),
  findByRefreshToken: jest.fn(),
  findAllByUserId: jest.fn(),
  delete: jest.fn(),
};

export default mockUserSessionRepo;
