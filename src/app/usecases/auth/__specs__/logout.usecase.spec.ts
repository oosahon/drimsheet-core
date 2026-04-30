import userEntity from '../../../../domain/user/entities/user.entity';
import mockUserSessionRepo from '../../../../infra/persistence/repos/__mocks__/user-session.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockRequestContext, {
  mockClientSession,
} from '../../../contracts/app/__mocks__/request-context.mock';
import authError from '../../../errors/auth.errors';
import makeLogoutUseCase from '../logout.usecase';

describe('makeLogoutUseCase', () => {
  const correlationId = 'mock-correlation-id'; // This is what is defined in request-context.mock.ts

  const [mockUser] = userEntity.make({
    email: 'johndoe@example.com',
    emailVerified: true,
    firstName: 'John',
    lastName: 'Doe',
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // The mockRequestContext is automatically returning the default payload
    // including the mockClientSession and 'mock-correlation-id'
    mockAuthService.verifyRefreshToken.mockReturnValue({
      id: mockUser.id,
    });
  });

  const getUseCase = () =>
    makeLogoutUseCase(mockRequestContext, mockAuthService, mockUserSessionRepo);

  it('should clear refresh token and delete session if valid refresh token is present', async () => {
    mockClientSession.getRefreshToken.mockReturnValue('valid-refresh-token');

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
  });

  it('should only clear cookie if refresh token is null', async () => {
    mockClientSession.getRefreshToken.mockReturnValue(null);

    const usecase = getUseCase();
    await usecase();

    expect(mockAuthService.verifyRefreshToken).not.toHaveBeenCalled();
    expect(mockUserSessionRepo.delete).not.toHaveBeenCalled();
    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });

  it('should clear cookie and ignore delete if refresh token is invalid', async () => {
    mockClientSession.getRefreshToken.mockReturnValue('invalid-refresh-token');
    mockAuthService.verifyRefreshToken.mockImplementation(() => {
      throw new authError.InvalidToken();
    });

    const usecase = getUseCase();
    await usecase();

    expect(mockAuthService.verifyRefreshToken).toHaveBeenCalledWith(
      'invalid-refresh-token'
    );
    expect(mockUserSessionRepo.delete).not.toHaveBeenCalled();
    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });

  it('should clear cookie and catch exception if verifyThrows', async () => {
    mockClientSession.getRefreshToken.mockReturnValue('error-refresh-token');
    mockAuthService.verifyRefreshToken.mockImplementation(() => {
      throw new Error('Some error');
    });

    const usecase = getUseCase();
    await usecase();

    expect(mockAuthService.verifyRefreshToken).toHaveBeenCalledWith(
      'error-refresh-token'
    );
    expect(mockUserSessionRepo.delete).not.toHaveBeenCalled();
    expect(mockClientSession.clearRefreshToken).toHaveBeenCalled();
  });
});
