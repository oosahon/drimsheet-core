import IAuthService from '../../../app/contracts/infra/auth-service.contract';

const mockAuthService: jest.Mocked<IAuthService> = {
  hashPassword: jest.fn(),
  getSignupVerificationLink: jest.fn(),
  comparePassword: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  generatePasswordResetToken: jest.fn(),
  verifyPasswordResetToken: jest.fn(),
  getResetPasswordLink: jest.fn(),
  verifyAuthToken: jest.fn(),
  getAuthUser: jest.fn(),
  isPermittedEmail: jest.fn(),
};

export default mockAuthService;
