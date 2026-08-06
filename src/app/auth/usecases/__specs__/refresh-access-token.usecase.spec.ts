import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import mockAppContext, {
  mockClientSession,
} from '../../../context/contracts/__mocks__/app-context.mock';
import { mockUserRepo } from '../../../user/contracts/__mocks__/user.repos.mock';
import mockAuthService from '../../contracts/__mocks__/token-service.mock';
import mockUserSessionRepo from '../../contracts/__mocks__/user-session.repo.mock';
import authError from '../../errors/auth.error';
import makeIssueUserSessionHelper from '../helpers/issue-user-session.helper';
import makeRefreshAccessTokenUseCase from '../refresh-access-token.usecase';

jest.mock('../helpers/issue-user-session.helper');

describe('refreshAccessTokenUseCase', () => {
  const correlationId = 'test-corr-id';
  const mockRefreshToken = 'mock-refresh-token';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;

  const getUseCase = () =>
    makeRefreshAccessTokenUseCase({
      reqContext: mockAppContext,
      userRepo: mockUserRepo,
      tokenService: mockAuthService,
      eventBus: mockEventBus,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
    });

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
    } as unknown as ReturnType<typeof mockAppContext.get>);

    mockClientSession.getRefreshToken.mockReturnValue(mockRefreshToken);

    mockAuthService.verifyRefreshToken.mockReturnValue({
      id: mockUserId,
    });

    mockUserRepo.findById.mockResolvedValue({
      id: mockUserId,
    } as unknown as IUser);

    mockUserSessionRepo.delete.mockResolvedValue(true);

    (makeIssueUserSessionHelper as jest.Mock).mockResolvedValue({
      token: 'new-token',
    });
  });

  it('throws appError.Unauthorized if refresh token is missing', async () => {
    mockClientSession.getRefreshToken.mockReturnValue(undefined);
    const useCase = getUseCase();
    await expect(useCase()).rejects.toThrow('app_error_unauthorized');
    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });

  it('propagates AuthError if refresh token is invalid', async () => {
    mockAuthService.verifyRefreshToken.mockImplementation(() => {
      throw new authError.InvalidToken();
    });
    const useCase = getUseCase();
    await expect(useCase()).rejects.toThrow(authError.Base);
    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });

  it('throws appError.Unauthorized if user is not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);
    const useCase = getUseCase();
    await expect(useCase()).rejects.toThrow('app_error_unauthorized');
    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });

  it('throws appError.Unauthorized if session is not found in DB', async () => {
    mockUserSessionRepo.delete.mockResolvedValue(false);
    (makeIssueUserSessionHelper as jest.Mock).mockImplementationOnce(
      async ({ beforeCreate }) => {
        await beforeCreate('mock-tx');
      }
    );
    const useCase = getUseCase();
    await expect(useCase()).rejects.toThrow('app_error_unauthorized');
    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });

  it('successfully returns the new user session', async () => {
    const useCase = getUseCase();
    const result = await useCase();

    expect(result).toEqual({ token: 'new-token' });

    expect(makeIssueUserSessionHelper).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: mockUserId },
        reqContext: mockAppContext,
        tokenService: mockAuthService,
        userSessionRepo: mockUserSessionRepo,
        eventBus: mockEventBus,
        repoService: mockRepoService,
        events: [],
        replaceExistingClientSession: false,
      })
    );

    const helperArgs = (makeIssueUserSessionHelper as jest.Mock).mock
      .calls[0][0];
    await helperArgs.beforeCreate('mock-tx');
    expect(mockUserSessionRepo.delete).toHaveBeenCalledWith(
      mockUserId,
      mockRefreshToken,
      { correlationId, tx: 'mock-tx' }
    );
  });

  it('does not clear the cookie for an unexpected failure', async () => {
    mockUserRepo.findById.mockRejectedValue(new Error('database unavailable'));

    await expect(getUseCase()()).rejects.toThrow('database unavailable');
    expect(mockClientSession.clearRefreshToken).not.toHaveBeenCalled();
  });
});
