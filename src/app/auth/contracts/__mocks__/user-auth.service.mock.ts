import IUserAuthService from '@app/auth/contracts/user-auth.service.contract';

const mockUserAuthService: jest.Mocked<IUserAuthService> = {
  make: jest.fn(),
  addStrategy: jest.fn(),
  replacePassword: jest.fn(),
  recordFailedLogin: jest.fn(),
  resetFailedLoginAttempts: jest.fn(),
};

export default mockUserAuthService;
