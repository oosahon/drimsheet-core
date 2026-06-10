import IAuthService from '../../../app/auth/contracts/auth-service.contract';

const mockAuthService: jest.Mocked<IAuthService> = {
  hashPassword: jest.fn(),
  generateSignupToken: jest.fn(),
  comparePassword: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  generatePasswordResetToken: jest.fn(),
  verifyPasswordResetToken: jest.fn(),
  verifySignupToken: jest.fn(),
  verifyAuthToken: jest.fn(),
  getAuthUser: jest.fn(),
  verifyRefreshToken: jest.fn(),
  isPermittedEmail: jest.fn(),
};

export default mockAuthService;
