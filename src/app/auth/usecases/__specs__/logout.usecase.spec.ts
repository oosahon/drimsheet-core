import userEntity from '../../../../domain/user/entities/user.entity';
import mockAppContext, {
  mockClientSession,
} from '../../../_internal/contracts/__mocks__/app-context.contract.mock';
import mockAuthService from '../../contracts/__mocks__/token-service.contract.mock';
import mockUserSessionRepo from '../../contracts/__mocks__/user-session.repo.contract.mock';
import authError from '../../errors/auth.error';
import makeLogoutUseCase from '../logout.usecase';

describe('makeLogoutUseCase', () => {
  const correlationId = '854e4567-e89b-42d3-a456-426614174001'; // This is what is defined in app-context.mock.ts

  const [mockUser] = userEntity.make({
    email: 'johndoe@example.com',
    emailVerified: true,
    firstName: 'John',
    lastName: 'Doe',
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // The mockAppContext is automatically returning the default payload
    // including the mockClientSession and 'mock-correlation-id'
    mockAuthService.verifyRefreshToken.mockReturnValue({
      id: mockUser.id,
    });
  });

  const getUseCase = () =>
    makeLogoutUseCase({
      reqContext: mockAppContext,
      tokenService: mockAuthService,
      userSessionRepo: mockUserSessionRepo,
    });

  it('should delete a valid refresh-token session before clearing the cookie', async () => {
    mockClientSession.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockUserSessionRepo.delete.mockResolvedValue(true);

    const usecase = getUseCase();
    await usecase();

    expect(mockAuthService.verifyRefreshToken).toHaveBeenCalledWith(
      'valid-refresh-token'
    );
    expect(mockUserSessionRepo.delete).toHaveBeenCalledWith(
      mockUser.id,
      'valid-refresh-token',
      { correlationId }
    );
    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
    expect(mockUserSessionRepo.delete.mock.invocationCallOrder[0]).toBeLessThan(
      mockClientSession.clearRefreshToken.mock.invocationCallOrder[0]
    );
  });

  it('should clear the cookie without verification when no token is present', async () => {
    mockClientSession.getRefreshToken.mockReturnValue(null);

    const usecase = getUseCase();
    await usecase();

    expect(mockAuthService.verifyRefreshToken).not.toHaveBeenCalled();
    expect(mockUserSessionRepo.delete).not.toHaveBeenCalled();
    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });

  it.each([
    ['invalid', new authError.InvalidToken()],
    ['expired', new authError.ExpiredToken()],
  ])(
    'should clear the cookie when the refresh token is %s',
    async (_, error) => {
      mockClientSession.getRefreshToken.mockReturnValue(
        'unusable-refresh-token'
      );
      mockAuthService.verifyRefreshToken.mockImplementation(() => {
        throw error;
      });

      const usecase = getUseCase();
      await usecase();

      expect(mockAuthService.verifyRefreshToken).toHaveBeenCalledWith(
        'unusable-refresh-token'
      );
      expect(mockUserSessionRepo.delete).not.toHaveBeenCalled();
      expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
    }
  );

  it('should clear the cookie when the valid token session is already absent', async () => {
    mockClientSession.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockUserSessionRepo.delete.mockResolvedValue(false);

    const usecase = getUseCase();
    await usecase();

    expect(mockUserSessionRepo.delete).toHaveBeenCalledWith(
      mockUser.id,
      'valid-refresh-token',
      { correlationId }
    );
    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });

  it('should propagate unexpected verification failures without clearing the cookie', async () => {
    mockClientSession.getRefreshToken.mockReturnValue('error-refresh-token');
    const error = new Error('Some error');
    mockAuthService.verifyRefreshToken.mockImplementation(() => {
      throw error;
    });

    const usecase = getUseCase();
    await expect(usecase()).rejects.toBe(error);

    expect(mockAuthService.verifyRefreshToken).toHaveBeenCalledWith(
      'error-refresh-token'
    );
    expect(mockUserSessionRepo.delete).not.toHaveBeenCalled();
    expect(mockClientSession.clearRefreshToken).not.toHaveBeenCalled();
  });

  it('should propagate persistence failures without clearing the cookie', async () => {
    mockClientSession.getRefreshToken.mockReturnValue('valid-refresh-token');
    const error = new Error('Database unavailable');
    mockUserSessionRepo.delete.mockRejectedValue(error);

    const usecase = getUseCase();
    await expect(usecase()).rejects.toBe(error);

    expect(mockUserSessionRepo.delete).toHaveBeenCalledWith(
      mockUser.id,
      'valid-refresh-token',
      { correlationId }
    );
    expect(mockClientSession.clearRefreshToken).not.toHaveBeenCalled();
  });
});
