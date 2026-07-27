import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/values/email.vo';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '../../../../shared/types/repo.types';
import mockAppContext, {
  mockClientSession,
} from '../../../context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '../../../context/contracts/app-context.contract';
import mockAuthService from '../../contracts/__mocks__/token-service.mock';
import mockUserSessionRepo from '../../contracts/__mocks__/user-session.repo.mock';
import makeOauthUsecase from '../oauth.usecase';

describe('makeOauthUsecase', () => {
  const correlationId = 'test-corr-id';
  const webAppUrl = 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );
    mockAppContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as IAppContextData);

    mockAuthService.generateAccessToken.mockResolvedValue('mock-access-token');
    mockAuthService.generateRefreshToken.mockResolvedValue(
      'mock-refresh-token'
    );
  });

  const getMockUser = () =>
    ({
      id: 'existing-user-id',
      email: emailValue.make('johndoe@example.com'),
    }) as unknown as IUser;

  const getUseCase = () =>
    makeOauthUsecase({
      reqContext: mockAppContext,
      tokenService: mockAuthService,
      eventBus: mockEventBus,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
      webAppUrl,
    });

  describe('handleGoogleCallback', () => {
    it('should generate tokens, update session, and return the formatted redirect URL', async () => {
      const mockUser = getMockUser();
      mockClientSession.getRefreshToken.mockReturnValue(null);

      const usecase = getUseCase();
      const redirectUrl = await usecase.handleGoogleCallback(mockUser);

      expect(mockAuthService.generateAccessToken).toHaveBeenCalledWith(
        mockUser
      );
      expect(mockAuthService.generateRefreshToken).toHaveBeenCalledWith(
        mockUser
      );

      expect(mockRepoService.runInTransaction).toHaveBeenCalled();
      expect(mockUserSessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          userId: mockUser.id,
          refreshToken: 'mock-refresh-token',
          lastLoginAt: expect.any(Date),
          createdAt: expect.any(Date),
        }),
        { correlationId, tx: 'mock-tx' }
      );

      expect(mockClientSession.setRefreshToken).toHaveBeenCalledWith(
        'mock-refresh-token'
      );

      expect(mockEventBus.publish).toHaveBeenCalled();

      expect(redirectUrl).toBe('http://localhost:3000/auth/oauth-confirmation');
    });

    it('should delete existing session if a previous refresh token is present', async () => {
      const mockUser = getMockUser();
      mockClientSession.getRefreshToken.mockReturnValue('old-refresh-token');

      const usecase = getUseCase();
      await usecase.handleGoogleCallback(mockUser);

      expect(mockUserSessionRepo.delete).toHaveBeenCalledWith(
        mockUser.id,
        'old-refresh-token',
        { correlationId, tx: 'mock-tx' }
      );
    });
  });
});
