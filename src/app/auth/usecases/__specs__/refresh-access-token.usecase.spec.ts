import { TEntityId } from '@shared/types/uuid';

import { IUser } from '@domain/user/types/user.types';

import mockTokenService from '@app/auth/contracts/__mocks__/token-service.mock';
import mockUserSessionPersistenceService from '@app/auth/contracts/__mocks__/user-session-persistence.service.mock';
import mockUserSessionService from '@app/auth/contracts/__mocks__/user-session.service.mock';
import authError from '@app/auth/errors/auth.error';
import makeRefreshAccessTokenUseCase from '@app/auth/usecases/refresh-access-token.usecase';
import mockAppContext, {
  mockClientSession,
} from '@app/context/contracts/__mocks__/app-context.mock';
import { mockUserRepo } from '@app/user/contracts/__mocks__/user.repos.mock';

describe('refreshAccessTokenUseCase', () => {
  const correlationId = 'test-corr-id';
  const presentedRefreshToken = 'presented-refresh-token';
  const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const user = { id: userId } as unknown as IUser;
  const userSession = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    userId,
    refreshToken: 'replacement-refresh-token',
    lastLoginAt: new Date('2026-04-01T00:00:00.000Z'),
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
  };

  const getUseCase = () =>
    makeRefreshAccessTokenUseCase({
      reqContext: mockAppContext,
      userRepo: mockUserRepo,
      tokenService: mockTokenService,
      userSessionService: mockUserSessionService,
      userSessionPersistenceService: mockUserSessionPersistenceService,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as ReturnType<typeof mockAppContext.get>);
    mockClientSession.getRefreshToken.mockReturnValue(presentedRefreshToken);
    mockTokenService.verifyRefreshToken.mockReturnValue({ id: userId });
    mockUserRepo.findById.mockResolvedValue(user);
    mockUserSessionService.prepare.mockResolvedValue({
      accessToken: 'replacement-access-token',
      refreshToken: 'replacement-refresh-token',
      userSession,
      priorClientSession: null,
    });
    mockUserSessionPersistenceService.rotateSession
      .mockReset()
      .mockResolvedValue(true);
  });

  it('throws Unauthorized and clears the client token when no refresh token is presented', async () => {
    mockClientSession.getRefreshToken.mockReturnValue(undefined);

    await expect(getUseCase()()).rejects.toThrow('app_error_unauthorized');

    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
    expect(mockUserSessionService.prepare).not.toHaveBeenCalled();
  });

  it('propagates an invalid-token AuthError and clears the client token', async () => {
    mockTokenService.verifyRefreshToken.mockImplementation(() => {
      throw new authError.InvalidToken();
    });

    await expect(getUseCase()()).rejects.toThrow(authError.Base);

    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });

  it('throws Unauthorized and clears the client token when the user is absent', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(getUseCase()()).rejects.toThrow('app_error_unauthorized');

    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });

  it('throws Unauthorized without exposing credentials when the presented session is absent', async () => {
    mockUserSessionPersistenceService.rotateSession.mockResolvedValue(false);

    await expect(getUseCase()()).rejects.toThrow('app_error_unauthorized');

    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
    expect(mockClientSession.setRefreshToken).not.toHaveBeenCalled();
  });

  it('rotates the presented session and returns the prepared access token', async () => {
    const result = await getUseCase()();

    expect(mockUserSessionService.prepare).toHaveBeenCalledWith(user);
    expect(
      mockUserSessionPersistenceService.rotateSession
    ).toHaveBeenCalledWith(
      {
        userSession,
        presentedSession: {
          userId,
          refreshToken: presentedRefreshToken,
        },
      },
      { correlationId }
    );
    expect(mockClientSession.setRefreshToken).toHaveBeenCalledWith(
      'replacement-refresh-token'
    );
    expect(result).toEqual({ accessToken: 'replacement-access-token' });
  });

  it('does not clear the client token for an unexpected failure', async () => {
    mockUserRepo.findById.mockRejectedValue(new Error('database unavailable'));

    await expect(getUseCase()()).rejects.toThrow('database unavailable');
    expect(mockClientSession.clearRefreshToken).not.toHaveBeenCalled();
  });
});
