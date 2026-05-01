import { ITransactionalEmailDto } from '../../../contracts/dto/workers.dto';
import { IInternalMailer } from '../../../contracts/infra/transactional-email-agent.contract';

describe('getSentEmail', () => {
  const mockInternalMailer: jest.Mocked<IInternalMailer> = {
    getEmail: jest.fn(),
    send: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('throws ErrorForbidden if NODE_ENV is not test', async () => {
    jest.doMock('../../../../infra/config/vars.config', () => ({
      NODE_ENV: 'production',
    }));

    const { default: getSentEmail } = await import('../get-sent-email.usecase');
    const useCase = getSentEmail(mockInternalMailer);

    await expect(useCase('test@test.com', 'subject')).rejects.toThrow(
      'http_error_forbidden'
    );
  });

  it('returns email correctly when NODE_ENV is test', async () => {
    jest.doMock('../../../../infra/config/vars.config', () => ({
      NODE_ENV: 'test',
    }));

    const { default: getSentEmail } = await import('../get-sent-email.usecase');
    const useCase = getSentEmail(mockInternalMailer);

    const mockEmailDto: ITransactionalEmailDto = {
      correlationId: 'test-corr-id',
      emails: ['test@test.com'],
      subject: 'subject',
      html: '<html></html>',
    };

    mockInternalMailer.getEmail.mockReturnValue(mockEmailDto);

    const result = await useCase('test@test.com', 'subject');

    expect(result).toEqual(mockEmailDto);
    expect(mockInternalMailer.getEmail).toHaveBeenCalledWith(
      'test@test.com',
      'subject'
    );
  });
});
