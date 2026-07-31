import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/values/email.vo';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.mock';
import mockUserAuthRepo from '../../contracts/__mocks__/user-auth.repo.mock';

import mockUserRepo from '../../../../domain/user/repos/__mocks__/user.repo.impl.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import appError from '../../../../shared/values/errors/app.error';
import mockAppContext from '../../../context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '../../../context/contracts/app-context.contract';
import mockPasswordService from '../../contracts/__mocks__/password-service.mock';
import IEmailVerificationService from '../../contracts/email-verification-service.contract';
import { IUserSignupReq } from '../../dtos/auth/auth.dto';
import makeSignupWithEmailUsecase from '../signup-with-email.usecase';

const mockEmailVerificationService: jest.Mocked<IEmailVerificationService> = {
  send: jest.fn(),
};

describe('makeSignupWithEmailUsecase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepo.create.mockReset().mockResolvedValue(undefined);
    mockUserAuthRepo.create.mockReset().mockResolvedValue(undefined);
    mockEventBus.publish.mockReset().mockResolvedValue(undefined);
    mockEmailVerificationService.send.mockReset().mockResolvedValue(true);
    mockUserRepo.findByEmail.mockReset().mockResolvedValue(null);
    mockPasswordService.makePassword
      .mockReset()
      .mockImplementation((input) => input as string);
    mockPasswordService.hash.mockReset().mockResolvedValue('hashed-password');
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );
  });

  it('should throw appError.UnprocessableEntity if payload is invalid', async () => {
    const usecase = makeSignupWithEmailUsecase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      repoService: mockRepoService,
      emailVerificationService: mockEmailVerificationService,
    });

    const invalidPayload: IUserSignupReq = {
      firstName: '', // empty name
      lastName: '', // empty name
      email: 'not-an-email', // invalid email
      password: 'short', // invalid password
    };

    await expect(usecase(invalidPayload)).rejects.toThrow(
      appError.UnprocessableEntity
    );
  });

  it('should successfully sign up a new user', async () => {
    const correlationId = '854e4567-e89b-42d3-a456-426614174001';
    const idempotencyKey = 'test-idemp-key';
    mockAppContext.get.mockReturnValue({
      correlationId,
      idempotencyKey,
    } as IAppContextData);

    const payload: IUserSignupReq = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      password: 'SecurePassword123!',
    };

    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue('hashed-password');

    const usecase = makeSignupWithEmailUsecase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      repoService: mockRepoService,
      emailVerificationService: mockEmailVerificationService,
    });

    await usecase(payload);

    expect(mockAppContext.get).toHaveBeenCalledTimes(1);

    const email = emailValue.make(payload.email);
    const password = payload.password;

    // Check if user was searched by email
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(email, {
      correlationId,
    });

    expect(mockPasswordService.makePassword).toHaveBeenCalledWith(password);
    expect(mockPasswordService.hash).toHaveBeenCalledTimes(1);
    expect(mockPasswordService.hash).toHaveBeenCalledWith(password);

    // Assert that save methods were called correctly
    expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
    const savedUserArgs = mockUserRepo.create.mock.calls[0];
    const savedUser = savedUserArgs[0];
    const saveOptions = savedUserArgs[1];
    expect(savedUser.firstName).toBe(payload.firstName);
    expect(savedUser.lastName).toBe(payload.lastName);
    expect(savedUser.email).toBe(email);
    expect(savedUser.emailVerified).toBe(false);
    expect(saveOptions.correlationId).toBe(correlationId);
    expect(saveOptions.tx).toBe('mock-tx');
    expect(saveOptions.history.entityId).toBe(savedUser.id);
    expect(saveOptions.history.correlationId).toBe(correlationId);

    expect(mockUserAuthRepo.create).toHaveBeenCalledTimes(1);
    const [savedAuth, savedAuthOptions] = mockUserAuthRepo.create.mock.calls[0];
    expect(mockUserAuthRepo.create).toHaveBeenCalledWith(
      savedAuth,
      savedAuthOptions
    );
    expect(savedAuth.userId).toBe(savedUser.id);
    expect(savedAuth.password).toBe('hashed-password');
    expect(savedAuth.failedLoginAttempts).toBe(0);
    expect(savedAuth.strategy).toEqual(['email']);
    expect(savedAuth.createdAt).toBeInstanceOf(Date);
    expect(savedAuth.updatedAt).toBe(savedAuth.createdAt);
    expect(savedAuthOptions).toEqual({
      correlationId,
      tx: 'mock-tx',
    });

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const [published] = mockEventBus.publish.mock.calls[0];
    expect(Array.isArray(published)).toBe(true);
    if (!Array.isArray(published)) {
      throw new Error('Expected an event array');
    }
    expect(published).toHaveLength(1);
    expect(published[0].correlationId).toBe(correlationId);
    expect(published[0].idempotencyKey).toBe(idempotencyKey);
    expect(published[0].data).toBe(savedUser);
  });

  it('should wait for event publication to complete', async () => {
    const correlationId = '854e4567-e89b-42d3-a456-426614174001';
    mockAppContext.get.mockReturnValue({
      correlationId,
      idempotencyKey: 'test-idemp-key',
    } as IAppContextData);
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue('hashed-password');

    let completePublication: (() => void) | undefined;
    const publication = new Promise<void>((resolve) => {
      completePublication = resolve;
    });
    mockEventBus.publish.mockReturnValue(publication);

    const usecase = makeSignupWithEmailUsecase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      repoService: mockRepoService,
      emailVerificationService: mockEmailVerificationService,
    });

    let signupCompleted = false;
    const signup = usecase({
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      password: 'SecurePassword123!',
    }).then(() => {
      signupCompleted = true;
    });

    await new Promise<void>((resolve) => setImmediate(resolve));
    const completedBeforePublication = signupCompleted;

    completePublication?.();
    await signup;

    expect(completedBeforePublication).toBe(false);
  });

  it('should not create auth data or publish when user creation fails', async () => {
    mockAppContext.get.mockReturnValue({
      correlationId: '854e4567-e89b-42d3-a456-426614174001',
      idempotencyKey: 'test-idemp-key',
    } as IAppContextData);
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue('hashed-password');
    mockUserRepo.create.mockRejectedValue(new Error('user create failed'));

    const usecase = makeSignupWithEmailUsecase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      repoService: mockRepoService,
      emailVerificationService: mockEmailVerificationService,
    });

    await expect(
      usecase({
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        password: 'SecurePassword123!',
      })
    ).rejects.toThrow('user create failed');

    expect(mockUserAuthRepo.create).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should not publish when auth data creation fails', async () => {
    mockAppContext.get.mockReturnValue({
      correlationId: '854e4567-e89b-42d3-a456-426614174001',
      idempotencyKey: 'test-idemp-key',
    } as IAppContextData);
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue('hashed-password');
    mockUserAuthRepo.create.mockRejectedValue(
      new Error('user auth create failed')
    );

    const usecase = makeSignupWithEmailUsecase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      repoService: mockRepoService,
      emailVerificationService: mockEmailVerificationService,
    });

    await expect(
      usecase({
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        password: 'SecurePassword123!',
      })
    ).rejects.toThrow('user auth create failed');

    expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should return the generic response and request verification if user already exists', async () => {
    const correlationId = '854e4567-e89b-42d3-a456-426614174001';
    mockAppContext.get.mockReturnValue({
      correlationId,
    } as IAppContextData);

    const payload: IUserSignupReq = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'janedoe@example.com',
      password: 'SecurePassword123!',
    };

    const existingUser: IUser = {
      id: '854e4567-e89b-42d3-a456-426614174002' as TEntityId,
      firstName: 'Existing',
      lastName: 'User',
      email: payload.email,
      emailVerified: false,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      deletedAt: null,
    };
    mockUserRepo.findByEmail.mockResolvedValue(existingUser);

    const usecase = makeSignupWithEmailUsecase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      repoService: mockRepoService,
      emailVerificationService: mockEmailVerificationService,
    });

    await expect(usecase(payload)).resolves.toBeUndefined();

    expect(mockUserRepo.findByEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailVerificationService.send).toHaveBeenCalledWith(
      existingUser,
      correlationId
    );
    expect(mockPasswordService.hash).toHaveBeenCalledWith(payload.password);
    expect(mockUserRepo.create).not.toHaveBeenCalled();
    expect(mockUserAuthRepo.create).not.toHaveBeenCalled();
  });

  it('propagates persistence failures', async () => {
    mockAppContext.get.mockReturnValue({
      correlationId: '854e4567-e89b-42d3-a456-426614174001',
      idempotencyKey: 'test-idemp-key',
    } as IAppContextData);
    const persistenceFailure = new Error('persistence failure');
    mockRepoService.runInTransaction.mockRejectedValue(persistenceFailure);

    const usecase = makeSignupWithEmailUsecase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      repoService: mockRepoService,
      emailVerificationService: mockEmailVerificationService,
    });

    await expect(
      usecase({
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.com',
        password: 'CompilerDesign1!',
      })
    ).rejects.toBe(persistenceFailure);

    expect(mockEmailVerificationService.send).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('propagates event publication failures', async () => {
    mockAppContext.get.mockReturnValue({
      correlationId: '854e4567-e89b-42d3-a456-426614174001',
      idempotencyKey: 'test-idemp-key',
    } as IAppContextData);
    const publicationFailure = new Error('publication failed');
    mockEventBus.publish.mockRejectedValue(publicationFailure);

    const usecase = makeSignupWithEmailUsecase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      repoService: mockRepoService,
      emailVerificationService: mockEmailVerificationService,
    });

    await expect(
      usecase({
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.com',
        password: 'CompilerDesign1!',
      })
    ).rejects.toBe(publicationFailure);
  });
});
