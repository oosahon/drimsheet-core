import IUserSessionRepo from '../../../../app/contracts/repos/user-session.repo.contract';

export const mockUserSessionRepo: jest.Mocked<IUserSessionRepo> = {
  save: jest.fn(),
  findByRefreshToken: jest.fn(),
  findAllByUserId: jest.fn(),
  delete: jest.fn(),
};

export default mockUserSessionRepo;
