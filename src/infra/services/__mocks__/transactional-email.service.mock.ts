import ITransactionalEmailService from '../../../app/contracts/infra/transactional-email-service.contract';

const mockTransactionalEmailService: jest.Mocked<ITransactionalEmailService> = {
  sendEmailVerification: jest.fn(),
  sendPasswordResetLink: jest.fn(),
};

export default mockTransactionalEmailService;
