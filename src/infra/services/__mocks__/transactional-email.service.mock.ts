import ITransactionalEmailService from '../../../app/shared/contracts/transactional-email-service.contract';

const mockTransactionalEmailService: jest.Mocked<ITransactionalEmailService> = {
  sendEmailVerification: jest.fn(),
  sendPasswordResetLink: jest.fn(),
};

export default mockTransactionalEmailService;
