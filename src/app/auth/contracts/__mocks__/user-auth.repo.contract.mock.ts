import IUserAuthRepo from '../user-auth.repo.contract';

const mockUserAuthRepo: jest.Mocked<IUserAuthRepo> = {
  create: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  incrementFailedLoginAttempts: jest.fn(),
  resetFailedLoginAttempts: jest.fn(),
};

export default mockUserAuthRepo;
