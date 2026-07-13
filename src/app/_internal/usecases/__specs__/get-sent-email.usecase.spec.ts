import IVarsConfig from '../../../../shared/contracts/vars-config.contract';
import { IInternalMailer } from '../../../notification/contracts/transactional-email-agent.contract';
import { ITransactionalEmailDto } from '../../../notification/dtos/transactional-email/transactional-email.dto';
import getSentEmail from '../get-sent-email.usecase';

describe('getSentEmail', () => {
  const mockInternalMailer: jest.Mocked<IInternalMailer> = {
    getEmail: jest.fn(),
    send: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws ErrorForbidden if NODE_ENV is not test', async () => {
    const mockVarsConfig = {
      NODE_ENV: 'production',
    } as IVarsConfig;

    const useCase = getSentEmail({
      internalMailer: mockInternalMailer,
      varsConfig: mockVarsConfig,
    });

    await expect(useCase('test@test.com', 'subject')).rejects.toThrow(
      'app_error_forbidden'
    );
  });

  it('returns email correctly when NODE_ENV is test', async () => {
    const mockVarsConfig = {
      NODE_ENV: 'test',
    } as IVarsConfig;

    const useCase = getSentEmail({
      internalMailer: mockInternalMailer,
      varsConfig: mockVarsConfig,
    });

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
