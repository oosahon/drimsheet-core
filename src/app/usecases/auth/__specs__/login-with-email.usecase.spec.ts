import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserRepo from '../../../../infra/persistence/repos/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import {
  ErrorBadRequest,
  ErrorUnprocessableEntity,
} from '../../../../shared/value-objects/error';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import loginWithEmailUseCase from '../login-with-email.usecase';

describe('loginWithEmailUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ErrorUnprocessableEntity if payload is invalid', async () => {
    const usecase = loginWithEmailUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus
    );

    const invalidPayload = {
      email: 'not-an-email',
      password: '',
    } as unknown as Parameters<ReturnType<typeof loginWithEmailUseCase>>[0];

    await expect(usecase(invalidPayload)).rejects.toThrow(
      ErrorUnprocessableEntity
    );
  });

  it('should successfully log in a user and return tokens', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const payload = {
      email: 'johndoe@example.com',
      password: 'SecurePassword123!',
    };

    const mockUser = {
      id: 'existing-user-id',
      email: emailValue.make(payload.email),
      password: 'hashed-password',
    } as unknown as IUser;

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockAuthService.comparePassword.mockResolvedValue(true);
    mockAuthService.generateAuthToken.mockResolvedValue('auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('refresh-token');

    const usecase = loginWithEmailUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus
    );

    const result = await usecase(payload);

    expect(mockRequestContext.get).toHaveBeenCalledTimes(1);

    const email = emailValue.make(payload.email);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(email, {
      correlationId,
    });

    expect(mockAuthService.comparePassword).toHaveBeenCalledWith(
      payload.password,
      mockUser.password
    );

    expect(mockAuthService.generateAuthToken).toHaveBeenCalledWith(mockUser);
    expect(mockAuthService.generateRefreshToken).toHaveBeenCalledWith(mockUser);

    expect(mockEventBus.publish).toHaveBeenCalled();

    expect(result).toEqual({
      authToken: 'auth-token',
      refreshToken: 'refresh-token',
    });
  });

  it('should throw ErrorBadRequest if user does not exist', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const payload = {
      email: 'nonexistent@example.com',
      password: 'SecurePassword123!',
    };

    mockUserRepo.findByEmail.mockResolvedValue(null);

    const usecase = loginWithEmailUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus
    );

    await expect(usecase(payload)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(payload)).rejects.toThrow('Invalid email or password');

    const email = emailValue.make(payload.email);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(email, {
      correlationId,
    });
    expect(mockAuthService.comparePassword).not.toHaveBeenCalled();
  });

  it('should throw ErrorBadRequest if user has no password set', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const payload = {
      email: 'nopassword@example.com',
      password: 'SecurePassword123!',
    };

    const mockUser = {
      id: 'user-id',
      email: emailValue.make(payload.email),
    } as unknown as IUser;

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);

    const usecase = loginWithEmailUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus
    );

    await expect(usecase(payload)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(payload)).rejects.toThrow('Invalid email or password');
    expect(mockAuthService.comparePassword).not.toHaveBeenCalled();
  });

  it('should throw ErrorBadRequest if password does not match', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const payload = {
      email: 'johndoe@example.com',
      password: 'WrongPassword!',
    };

    const mockUser = {
      id: 'existing-user-id',
      email: emailValue.make(payload.email),
      password: 'hashed-password',
    } as unknown as IUser;

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockAuthService.comparePassword.mockResolvedValue(false);

    const usecase = loginWithEmailUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus
    );

    await expect(usecase(payload)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(payload)).rejects.toThrow('Invalid email or password');

    expect(mockAuthService.comparePassword).toHaveBeenCalledWith(
      payload.password,
      mockUser.password
    );
    expect(mockAuthService.generateAuthToken).not.toHaveBeenCalled();
  });
});
