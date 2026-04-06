import IAuthService from '../../../app/contracts/infra/auth-service.contract';

export const mockAuthService: jest.Mocked<IAuthService> = {
  hashPassword: jest.fn(),
  getSignupVerificationLink: jest.fn(),
  comparePassword: jest.fn(),
  generateAuthToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  generatePasswordResetToken: jest.fn(),
  verifyPasswordResetToken: jest.fn(),
  getResetPasswordLink: jest.fn(),
  verifyAuthToken: jest.fn(),
  getAuthUser: jest.fn(),
  isPermittedEmail: jest.fn(),
};

export default mockAuthService;
