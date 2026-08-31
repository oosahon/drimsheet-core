import IEmailVerificationService from '@app/auth/contracts/email-verification-service.contract';

const mockEmailVerificationService: jest.Mocked<IEmailVerificationService> = {
  send: jest.fn(),
};

export default mockEmailVerificationService;
