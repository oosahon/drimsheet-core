import { IUser } from '../../../../domain/user/types/user.types';
import { TEntityId } from '../../../../shared/types/uuid';
import authError from '../../../auth/errors/auth.error';
import { IUserSession } from '../../../shared/contracts/auth-service.contract';
import makeIssueUserSessionHelper from '../helpers/issue-user-session.helper';
import makeRefreshAccessTokenUseCase from '../refresh-access-token.usecase';

import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserSessionRepo from '../../../../infra/persistence/repos/__mocks__/user-session.repo.impl.mock';
import mockUserRepo from '../../../../infra/persistence/repos/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import mockRequestContext, {
  mockClientSession,
} from '../../../shared/contracts/__mocks__/request-context.mock';

jest.mock('../helpers/issue-user-session.helper');

describe('refreshAccessTokenUseCase', () => {
  const correlationId = 'test-corr-id';
  const mockRefreshToken = 'mock-refresh-token';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;

  const getUseCase = () =>
    makeRefreshAccessTokenUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus,
      mockUserSessionRepo,
      mockRepoService
    );

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as ReturnType<typeof mockRequestContext.get>);

    mockClientSession.getRefreshToken.mockReturnValue(mockRefreshToken);

    mockAuthService.verifyRefreshToken.mockReturnValue({
      id: mockUserId,
    });

    mockUserRepo.findById.mockResolvedValue({
      id: mockUserId,
    } as unknown as IUser);

    mockUserSessionRepo.findByRefreshToken.mockResolvedValue({
      id: 'session-id',
    } as unknown as IUserSession);

    (makeIssueUserSessionHelper as jest.Mock).mockResolvedValue({
      token: 'new-token',
    });
  });

  it('throws appError.Unauthorized if refresh token is missing', async () => {
    mockClientSession.getRefreshToken.mockReturnValue(undefined);
    const useCase = getUseCase();
    await expect(useCase()).rejects.toThrow('app_error_unauthorized');
  });

  it('propagates AuthError if refresh token is invalid', async () => {
    mockAuthService.verifyRefreshToken.mockImplementation(() => {
      throw new authError.InvalidToken();
    });
    const useCase = getUseCase();
    await expect(useCase()).rejects.toThrow(authError.Base);
  });

  it('throws appError.Unauthorized if user is not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);
    const useCase = getUseCase();
    await expect(useCase()).rejects.toThrow('app_error_unauthorized');
  });

  it('throws appError.Unauthorized if session is not found in DB', async () => {
    mockUserSessionRepo.findByRefreshToken.mockResolvedValue(null);
    const useCase = getUseCase();
    await expect(useCase()).rejects.toThrow('app_error_unauthorized');
  });

  it('successfully returns the new user session', async () => {
    const useCase = getUseCase();
    const result = await useCase();

    expect(result).toEqual({ token: 'new-token' });

    expect(makeIssueUserSessionHelper).toHaveBeenCalledWith({
      user: { id: mockUserId },
      reqContext: mockRequestContext,
      makeAuthService: mockAuthService,
      userSessionRepo: mockUserSessionRepo,
      eventBus: mockEventBus,
      repoService: mockRepoService,
      events: [],
    });
  });
});
