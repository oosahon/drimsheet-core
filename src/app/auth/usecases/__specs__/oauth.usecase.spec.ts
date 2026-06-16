import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserSessionRepo from '../../../../infra/persistence/repos/user/__mocks__/user-session.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import mockRequestContext, {
  mockClientSession,
} from '../../../../infra/services/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../../shared/contracts/request-context.contract';
import makeOauthUsecase from '../oauth.usecase';

describe('makeOauthUsecase', () => {
  const correlationId = 'test-corr-id';
  const webAppUrl = 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as IRequestContextData);

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
    makeOauthUsecase(
      mockRequestContext,
      mockAuthService,
      mockEventBus,
      mockUserSessionRepo,
      mockRepoService,
      webAppUrl
    );

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

      expect(redirectUrl).toBe(
        'http://localhost:3000/auth/oauth-confirmation?access_token=mock-access-token'
      );
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
