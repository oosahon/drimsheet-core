import { IUser } from '../../../../../domain/user/types/user.types';
import emailValue from '../../../../../domain/user/values/email.vo';
import mockEventBus from '../../../../../shared/contracts/__mocks__/event-bus.contract.mock';
import mockUserAuthRepo from '../../../contracts/__mocks__/user-auth.repo.contract.mock';

import mockUserRepo from '../../../../../domain/user/repos/__mocks__/user.repo.impl.mock';
import mockRepoService from '../../../../../shared/contracts/__mocks__/repo.contract.mock';
import mockAppContext from '../../../../_internal/contracts/__mocks__/app-context.contract.mock';
import { IAppContextData } from '../../../../_internal/contracts/app-context.contract';
import { EAuthStrategy, IUserAuth } from '../../../contracts/auth.types';
import { IOAuthProfile } from '../../../dtos/auth/auth.dto';
import makeGoogleOAuthHelper from '../google-oauth.helper';

describe('makeGoogleOAuthHelper', () => {
  const correlationId = '854e4567-e89b-42d3-a456-426614174001';
  const idempotencyKey = 'test-idemp-key';

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      correlationId,
      idempotencyKey,
    } as unknown as IAppContextData);
  });

  const validProfile: IOAuthProfile = {
    providerSubject: 'google-user-123',
    email: 'testuser@example.com',
    emailVerified: true,
    firstName: 'Test',
    lastName: 'User',
  };

  const getMockUser = () =>
    ({
      id: 'existing-user-id',
      email: emailValue.make(validProfile.email),
    }) as unknown as IUser;

  const getMockUserAuth = (overrides = {}) =>
    ({
      userId: 'existing-user-id',
      password: 'hashed-password',
      failedLoginAttempts: 0,
      strategy: [EAuthStrategy.Email],
      ...overrides,
    }) as unknown as IUserAuth;

  const getHelper = () =>
    makeGoogleOAuthHelper(
      mockEventBus,
      mockAppContext,
      mockUserRepo,
      mockUserAuthRepo,
      mockRepoService
    );

  it('should return error if profile lacks an email address', async () => {
    const helper = getHelper();
    const doneCallback = jest.fn();

    const invalidProfile = {
      firstName: 'Test',
      lastName: 'User',
    } as unknown as IOAuthProfile;

    await helper(invalidProfile, doneCallback);

    expect(doneCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'app_error_bad_request',
      }),
      false
    );
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should sync existing user and append Google strategy if it was missing', async () => {
    const mockUser = getMockUser();
    const mockUserAuth = getMockUserAuth({ strategy: [EAuthStrategy.Email] }); // doesn't have Google

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(mockUserAuth);

    const helper = getHelper();
    const doneCallback = jest.fn();

    await helper(validProfile, doneCallback);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.normalize(validProfile.email),
      { correlationId }
    );
    expect(mockUserAuthRepo.findByUserId).toHaveBeenCalledWith(mockUser.id, {
      correlationId,
      tx: 'mock-tx',
      lock: 'update',
    });

    expect(mockUserAuth.strategy).toEqual([EAuthStrategy.Email]);
    expect(mockUserAuthRepo.update).toHaveBeenCalledWith(
      {
        ...mockUserAuth,
        strategy: [EAuthStrategy.Email, EAuthStrategy.Google],
      },
      { correlationId, tx: 'mock-tx' }
    );

    expect(doneCallback).toHaveBeenCalledWith(null, mockUser);
    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
  });

  it('should simply return existing user if Google strategy is already present', async () => {
    const mockUser = getMockUser();
    const mockUserAuth = getMockUserAuth({
      strategy: [EAuthStrategy.Email, EAuthStrategy.Google],
    });

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(mockUserAuth);

    const helper = getHelper();
    const doneCallback = jest.fn();

    await helper(validProfile, doneCallback);

    expect(mockUserAuthRepo.update).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(doneCallback).toHaveBeenCalledWith(null, mockUser);
  });

  it('should reject an unverified email before looking up a user', async () => {
    const doneCallback = jest.fn();

    await getHelper()({ ...validProfile, emailVerified: false }, doneCallback);

    expect(doneCallback).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'app_error_bad_request' }),
      false
    );
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should reject a missing provider subject before looking up a user', async () => {
    const doneCallback = jest.fn();

    await getHelper()({ ...validProfile, providerSubject: '' }, doneCallback);

    expect(doneCallback).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'app_error_bad_request' }),
      false
    );
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should fail closed when an existing user has no auth record', async () => {
    const mockUser = getMockUser();
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(null);
    const doneCallback = jest.fn();

    await getHelper()(validProfile, doneCallback);

    expect(doneCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'auth_error_inconsistent_user_auth_internal_server_error',
      }),
      false
    );
    expect(mockUserAuthRepo.update).not.toHaveBeenCalled();
  });

  it('should create new user/userAuth in transaction if user does not exist', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null); // No user found

    const helper = getHelper();
    const doneCallback = jest.fn();

    await helper(validProfile, doneCallback);

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: validProfile.firstName,
        lastName: validProfile.lastName,
        email: 'testuser@example.com',
        emailVerified: true,
      }),
      expect.objectContaining({
        correlationId,
        tx: 'mock-tx',
        history: expect.any(Object),
      })
    );

    expect(mockUserAuthRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.any(String),
        password: null,
        failedLoginAttempts: 0,
        strategy: [EAuthStrategy.Google],
      }),
      expect.objectContaining({ correlationId, tx: 'mock-tx' })
    );

    expect(mockEventBus.publish).toHaveBeenCalled();

    expect(doneCallback).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        firstName: validProfile.firstName,
      })
    );
  });

  it('should fail the callback when user event publication rejects', async () => {
    const publicationError = new Error('Event publication failed');
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockEventBus.publish.mockRejectedValue(publicationError);
    const doneCallback = jest.fn();

    await getHelper()(validProfile, doneCallback);

    expect(doneCallback).toHaveBeenCalledWith(publicationError, false);
    expect(doneCallback).not.toHaveBeenCalledWith(null, expect.anything());
  });

  it('should catch and return systematic errors gracefully to done callback', async () => {
    mockUserRepo.findByEmail.mockRejectedValue(new Error('Database explosion'));

    const helper = getHelper();
    const doneCallback = jest.fn();

    await helper(validProfile, doneCallback);

    expect(doneCallback).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Database explosion' }),
      false
    );
  });

  it('should catch non-Error exceptions and map to ErrorInternalServerError', async () => {
    mockUserRepo.findByEmail.mockRejectedValue('String error');

    const helper = getHelper();
    const doneCallback = jest.fn();

    await helper(validProfile, doneCallback);

    expect(doneCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'app_error_internal_server_error',
      }),
      false
    );
  });
});
