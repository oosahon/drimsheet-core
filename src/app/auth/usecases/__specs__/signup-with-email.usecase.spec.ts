import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import passwordValue from '../../../../domain/user/value-objects/password.vo';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserAuthRepo from '../../../../infra/persistence/repos/user/__mocks__/user-auth.repo.impl.mock';

import mockUserRepo from '../../../../infra/persistence/repos/user/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import mockRequestContext from '../../../../infra/services/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../../shared/contracts/request-context.contract';
import { IEvent } from '../../../../shared/types/event.types';
import appError from '../../../shared/errors/app.error';
import makeSignupWithEmailUsecase from '../signup-with-email.usecase';

describe('makeSignupWithEmailUsecase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw appError.UnprocessableEntity if payload is invalid', async () => {
    const usecase = makeSignupWithEmailUsecase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus,
      mockUserAuthRepo,
      mockRepoService
    );

    const invalidPayload = {
      firstName: '', // empty name
      lastName: '', // empty name
      email: 'not-an-email', // invalid email
      password: 'short', // invalid password
      reportingCurrencyCode: 'NGN',
    } as any;

    await expect(usecase(invalidPayload)).rejects.toThrow(
      appError.UnprocessableEntity
    );
  });

  it('should successfully sign up a new user', async () => {
    const correlationId = '854e4567-e89b-42d3-a456-426614174001';
    const idempotencyKey = 'test-idemp-key';
    mockRequestContext.get.mockReturnValue({
      correlationId,
      idempotencyKey,
    } as IRequestContextData);

    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      password: 'SecurePassword123!',
      reportingCurrencyCode: 'NGN',
    };

    mockAuthService.isPermittedEmail.mockReturnValue(true);

    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockAuthService.hashPassword.mockResolvedValue('hashed-password');

    const usecase = makeSignupWithEmailUsecase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus,
      mockUserAuthRepo,
      mockRepoService
    );

    await usecase(payload);

    expect(mockRequestContext.get).toHaveBeenCalledTimes(1);

    const email = emailValue.make(payload.email);
    const password = passwordValue.make(payload.password);

    expect(mockAuthService.isPermittedEmail).toHaveBeenCalledTimes(1);
    expect(mockAuthService.isPermittedEmail).toHaveBeenCalledWith(email);

    // Check if user was searched by email
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(email, {
      correlationId,
    });

    expect(mockAuthService.hashPassword).toHaveBeenCalledTimes(1);
    expect(mockAuthService.hashPassword).toHaveBeenCalledWith(password);

    // Assert that save methods were called correctly
    expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
    const savedUserArgs = mockUserRepo.create.mock.calls[0];
    expect(savedUserArgs[0]).toMatchObject({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email,
      emailVerified: false,
    });
    expect(savedUserArgs[1]).toMatchObject({
      correlationId,
      tx: 'mock-tx',
      history: expect.any(Object),
    });

    expect(mockEventBus.publish).toHaveBeenCalled();
    const publishCalls = (mockEventBus.publish as jest.Mock).mock.calls;
    expect(publishCalls.length).toBeGreaterThan(0);
    publishCalls.forEach(([events]) => {
      expect(Array.isArray(events)).toBe(true);
      (events as IEvent<unknown>[]).forEach((event) => {
        expect(event).toMatchObject({
          correlationId,
          idempotencyKey,
        });
      });
    });
  });

  it('should throw appError.Conflict if user already exists', async () => {
    const correlationId = '854e4567-e89b-42d3-a456-426614174001';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'janedoe@example.com',
      password: 'SecurePassword123!',
      reportingCurrencyCode: 'NGN',
    };

    mockAuthService.isPermittedEmail.mockReturnValue(true);

    mockUserRepo.findByEmail.mockResolvedValue({
      id: 'existing-user-id',
    } as unknown as IUser);

    const usecase = makeSignupWithEmailUsecase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus,
      mockUserAuthRepo,
      mockRepoService
    );

    await expect(usecase(payload)).rejects.toThrow(appError.Conflict);
    await expect(usecase(payload)).rejects.toThrow('app_error_conflict');

    const email = emailValue.make(payload.email);
    expect(mockAuthService.isPermittedEmail).toHaveBeenCalledWith(email);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledTimes(2); // Since we called it twice in expect
    expect(mockAuthService.hashPassword).not.toHaveBeenCalled();
  });

  it('should throw appError.Forbidden if email is not permitted', async () => {
    const correlationId = '854e4567-e89b-42d3-a456-426614174001';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as unknown as IRequestContextData);

    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'notpermitted@example.com',
      password: 'SecurePassword123!',
      reportingCurrencyCode: 'NGN',
    };

    mockAuthService.isPermittedEmail.mockReturnValue(false);

    const usecase = makeSignupWithEmailUsecase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus,
      mockUserAuthRepo,
      mockRepoService
    );

    await expect(usecase(payload)).rejects.toThrow(appError.Forbidden);
    await expect(usecase(payload)).rejects.toThrow('app_error_forbidden');

    const email = emailValue.make(payload.email);
    expect(mockAuthService.isPermittedEmail).toHaveBeenCalledWith(email);
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
    expect(mockAuthService.hashPassword).not.toHaveBeenCalled();
  });
});
