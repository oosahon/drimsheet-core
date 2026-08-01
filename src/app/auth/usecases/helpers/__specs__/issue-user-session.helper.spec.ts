import userEntity from '../../../../../domain/user/entities/user.entity';
import { TEntityId } from '../../../../../shared/types/uuid';
import { IEvent } from '../../../../../shared/values/events/types/event.types';
import { IAppContextData } from '../../../../context/contracts/app-context.contract';
import makeIssueUserSessionHelper from '../issue-user-session.helper';

import mockEventBus from '../../../../../shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '../../../../../shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '../../../../../shared/types/repo.types';
import mockAppContext, {
  mockClientSession,
} from '../../../../context/contracts/__mocks__/app-context.mock';
import mockAuthService from '../../../contracts/__mocks__/token-service.mock';
import mockUserSessionRepo from '../../../contracts/__mocks__/user-session.repo.mock';

jest.mock('../../../../../shared/utils/uuid-generator', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue('123e4567-e89b-42d3-a456-426614174000'),
}));

describe('makeIssueUserSessionHelper', () => {
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
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );

    mockAppContext.get.mockReturnValue({
      correlationId: 'test-corr-id',
      clientSession: mockClientSession,
    } as unknown as IAppContextData);

    mockAuthService.generateAccessToken.mockResolvedValue('new-access-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('new-refresh-token');

    mockUserSessionRepo.delete.mockResolvedValue(undefined as never);
    mockUserSessionRepo.findByRefreshToken.mockResolvedValue(null);
    mockUserSessionRepo.create.mockResolvedValue(undefined as never);

    mockEventBus.publish.mockResolvedValue(undefined);
  });

  const runHelper = () =>
    makeIssueUserSessionHelper({
      user: mockUser,
      reqContext: mockAppContext,
      tokenService: mockAuthService,
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
    expect(mockUserSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '123e4567-e89b-42d3-a456-426614174000',
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

  it('runs refresh-token consumption in the session transaction', async () => {
    const beforeCreate = jest.fn().mockResolvedValue(undefined);

    await makeIssueUserSessionHelper({
      user: mockUser,
      reqContext: mockAppContext,
      tokenService: mockAuthService,
      userSessionRepo: mockUserSessionRepo,
      eventBus: mockEventBus,
      repoService: mockRepoService,
      events: mockEvents,
      beforeCreate,
      replaceExistingClientSession: false,
    });

    expect(beforeCreate).toHaveBeenCalledWith('mock-tx');
    expect(mockUserSessionRepo.delete).not.toHaveBeenCalled();
    expect(beforeCreate.mock.invocationCallOrder[0]).toBeLessThan(
      mockUserSessionRepo.create.mock.invocationCallOrder[0]
    );
  });

  it('does not expose credentials when the transaction rolls back', async () => {
    mockRepoService.runInTransaction.mockRejectedValueOnce(
      new Error('transaction failed')
    );

    await expect(runHelper()).rejects.toThrow('transaction failed');

    expect(mockClientSession.setRefreshToken).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
