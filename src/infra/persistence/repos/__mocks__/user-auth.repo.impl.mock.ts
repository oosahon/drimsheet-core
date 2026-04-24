import IUserAuthRepo from '../../../../app/contracts/repos/user-auth.repo.contract';

const mockUserAuthRepo: jest.Mocked<IUserAuthRepo> = {
  save: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  incrementFailedLoginAttempts: jest.fn(),
  resetFailedLoginAttempts: jest.fn(),
};

export default mockUserAuthRepo;
