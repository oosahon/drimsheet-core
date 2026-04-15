import userEntity from '../../../../../domain/user/entities/user.entity';
import { IEvent } from '../../../../../shared/types/event.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { IRequestContextData } from '../../../../contracts/app/request-context.contract';
import issueUserSessionHelper from '../issue-user-session.helper';

import mockEventBus from '../../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserSessionRepo from '../../../../../infra/persistence/repos/__mocks__/user-session.repo.impl.mock';
import mockAuthService from '../../../../../infra/services/__mocks__/auth.service.mock';
import mockRepoService from '../../../../../infra/services/__mocks__/repo.service.mock';
import mockRequestContext, {
  mockClientSession,
} from '../../../../contracts/app/__mocks__/request-context.mock';

jest.mock('../../../../../shared/utils/uuid-generator', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('issueUserSessionHelper', () => {
  const [mockUser] = userEntity.make({
    email: 'johndoe@example.com',
    emailVerified: true,
    firstName: 'John',
    lastName: 'Doe',
  });

  const mockEvents = [
    { eventName: 'UserLoggedIn' },
  ] as unknown as IEvent<unknown>[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequestContext.get.mockReturnValue({
      correlationId: 'test-corr-id',
      clientSession: mockClientSession,
    } as unknown as IRequestContextData);

    mockAuthService.generateAccessToken.mockResolvedValue('new-access-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('new-refresh-token');

    mockUserSessionRepo.delete.mockResolvedValue(undefined as never);
    mockUserSessionRepo.findByRefreshToken.mockResolvedValue(null);
    mockUserSessionRepo.save.mockResolvedValue(undefined as never);

    mockEventBus.publish.mockResolvedValue(undefined);
  });

  const runHelper = () =>
    issueUserSessionHelper({
      user: mockUser,
      reqContext: mockRequestContext,
      authService: mockAuthService,
      userSessionRepo: mockUserSessionRepo,
      eventBus: mockEventBus,
      repoService: mockRepoService,
      events: mockEvents,
    });

  it('should successfully issue a new session when no previous refresh tokens exist', async () => {
    mockClientSession.getRefreshToken.mockReturnValue(null);
    mockUserSessionRepo.findByRefreshToken.mockResolvedValue(null);

    const result = await runHelper();

    expect(result).toEqual({ accessToken: 'new-access-token' });

    // Check old ref token not deleted from client side since there wasn't one
    expect(mockUserSessionRepo.delete).not.toHaveBeenCalled();

    // Check save called once with newly generated values
    expect(mockUserSessionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mocked-uuid',
        userId: mockUser.id,
        refreshToken: 'new-refresh-token',
      }),
      { correlationId: 'test-corr-id', tx: 'mock-tx' }
    );

    expect(mockClientSession.setRefreshToken).toHaveBeenCalledWith(
      'new-refresh-token'
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(mockEvents);
  });

  it('should delete existing client refresh token if present', async () => {
    mockClientSession.getRefreshToken.mockReturnValue('old-client-token');
    mockUserSessionRepo.findByRefreshToken.mockResolvedValue(null);

    await runHelper();

    expect(mockUserSessionRepo.delete).toHaveBeenCalledWith(
      mockUser.id,
      'old-client-token',
      { correlationId: 'test-corr-id', tx: 'mock-tx' }
    );
  });

  it('should delete existing database refresh token if they clash/found during generation', async () => {
    mockClientSession.getRefreshToken.mockReturnValue(null);
    // Simulate finding a token exactly matching the NEW generated one to test the collision deletion branch
    mockUserSessionRepo.findByRefreshToken.mockResolvedValue({
      id: 'old-session-id' as TEntityId,
      userId: mockUser.id as TEntityId,
      refreshToken: 'new-refresh-token',
      lastLoginAt: new Date(),
      createdAt: new Date(),
    });

    await runHelper();

    expect(mockUserSessionRepo.delete).toHaveBeenCalledWith(
      mockUser.id,
      'new-refresh-token',
      { correlationId: 'test-corr-id', tx: 'mock-tx' }
    );
  });

  it('should delete BOTH client and db session if both branches match independently', async () => {
    mockClientSession.getRefreshToken.mockReturnValue('old-client-token');
    mockUserSessionRepo.findByRefreshToken.mockResolvedValue({
      id: 'old-session-id' as TEntityId,
      userId: mockUser.id as TEntityId,
      refreshToken: 'new-refresh-token',
      lastLoginAt: new Date(),
      createdAt: new Date(),
    });

    await runHelper();

    expect(mockUserSessionRepo.delete).toHaveBeenCalledTimes(2);
    expect(mockUserSessionRepo.delete).toHaveBeenNthCalledWith(
      1,
      mockUser.id,
      'old-client-token',
      { correlationId: 'test-corr-id', tx: 'mock-tx' }
    );
    expect(mockUserSessionRepo.delete).toHaveBeenNthCalledWith(
      2,
      mockUser.id,
      'new-refresh-token',
      { correlationId: 'test-corr-id', tx: 'mock-tx' }
    );
  });
});
