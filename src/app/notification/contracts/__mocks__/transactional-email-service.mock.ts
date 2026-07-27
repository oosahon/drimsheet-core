import ITransactionalEmailService from '../transactional-email-service.contract';

const mockTransactionalEmailService: jest.Mocked<ITransactionalEmailService> = {
  sendEmailVerification: jest.fn(),
  sendPasswordResetLink: jest.fn(),
};

export default mockTransactionalEmailService;
