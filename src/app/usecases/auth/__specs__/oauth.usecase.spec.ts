import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserSessionRepo from '../../../../infra/persistence/repos/__mocks__/user-session.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import {
  IClientSession,
  IRequestContextData,
} from '../../../contracts/app/request-context.contract';
import { ITransactionContext } from '../../../contracts/infra/repo.contract';
import oauthUsecase from '../oauth.usecase';

describe('oauthUsecase', () => {
  let mockClientSession: jest.Mocked<IClientSession>;
  const correlationId = 'test-corr-id';
  const webAppUrl = 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientSession = {
      getRefreshToken: jest.fn(),
      setRefreshToken: jest.fn(),
    };
    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as IRequestContextData);

    mockRepoService.runInTransaction.mockImplementation(async (cb) => {
      await cb('mock-tx' as unknown as ITransactionContext);
    });

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
    oauthUsecase(
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
      mockClientSession.getRefreshToken.mockReturnValue(null); // No previous session

      const usecase = getUseCase();
      const redirectUrl = await usecase.handleGoogleCallback(mockUser);

      // Verify token generation
      expect(mockAuthService.generateAccessToken).toHaveBeenCalledWith(
        mockUser
      );
      expect(mockAuthService.generateRefreshToken).toHaveBeenCalledWith(
        mockUser
      );

      // Verify session saving
      expect(mockRepoService.runInTransaction).toHaveBeenCalled();
      expect(mockUserSessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          userId: mockUser.id,
          refreshToken: 'mock-refresh-token',
          lastLoginAt: expect.any(Date),
          createdAt: expect.any(Date),
        }),
        { correlationId, tx: 'mock-tx' }
      );

      // Verify cookie handling
      expect(mockClientSession.setRefreshToken).toHaveBeenCalledWith(
        'mock-refresh-token'
      );

      // Verify event emitted
      expect(mockEventBus.publish).toHaveBeenCalled();

      // Verify final redirect string
      expect(redirectUrl).toBe(
        'http://localhost:3000/auth/callback?access_token=mock-access-token'
      );
    });

    it('should delete existing session if a previous refresh token is present', async () => {
      const mockUser = getMockUser();
      mockClientSession.getRefreshToken.mockReturnValue('old-refresh-token');

      const usecase = getUseCase();
      await usecase.handleGoogleCallback(mockUser);

      // Verify old session delete
      expect(mockUserSessionRepo.delete).toHaveBeenCalledWith(
        mockUser.id,
        'old-refresh-token',
        { correlationId, tx: 'mock-tx' }
      );
    });
  });
});
