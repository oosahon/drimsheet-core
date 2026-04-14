import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserRepo from '../../../../infra/persistence/repos/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import {
  AppError,
  ErrorBadRequest,
} from '../../../../shared/value-objects/error';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import resetPasswordUseCase from '../reset-password.usecase';

describe('resetPasswordUseCase', () => {
  const correlationId = 'test-corr-id';
  const idempotencyKey = 'idempotency-key';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
    mockRequestContext.get.mockReturnValue({
      correlationId,
      idempotencyKey,
    } as IRequestContextData);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const getValidPayload = () => ({
    token: 'valid-reset-token',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  });

  it('should explicitly fail validation if passwords do not match', async () => {
    const usecase = resetPasswordUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus
    );

    const payload = getValidPayload();
    payload.confirmPassword = 'DifferentPassword1!';

    await expect(usecase(payload)).rejects.toThrow(AppError);
  });

  it('should throw an error if the reset token is invalid or expired', async () => {
    mockAuthService.verifyPasswordResetToken.mockResolvedValue(null);

    const usecase = resetPasswordUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus
    );

    const payload = getValidPayload();

    await expect(usecase(payload)).rejects.toThrow(
      new ErrorBadRequest('Invalid or expired password reset token')
    );
  });

  it('should throw an error if user cannot be found in DB', async () => {
    mockAuthService.verifyPasswordResetToken.mockResolvedValue({
      id: 'internal-id' as TEntityId,
      email: 'user@example.com',
    });
    mockUserRepo.findById.mockResolvedValue(null);

    const usecase = resetPasswordUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus
    );

    const payload = getValidPayload();

    await expect(usecase(payload)).rejects.toThrow(
      new ErrorBadRequest('Invalid or expired password reset token')
    );
  });

  it('should successfully update the password and broadcast the event', async () => {
    const mockUser: IUser = {
      id: generateUUID(),
      email: emailValue.make('found@example.com'),
      emailVerified: true,
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      password: 'old-hash',
    };

    mockAuthService.verifyPasswordResetToken.mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
    });
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockAuthService.hashPassword.mockResolvedValue('new-hash');

    // Mocks for save and event propagation
    const usecase = resetPasswordUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus
    );

    const payload = getValidPayload();
    await usecase(payload);

    expect(mockAuthService.verifyPasswordResetToken).toHaveBeenCalledWith(
      payload.token
    );
    expect(mockUserRepo.findById).toHaveBeenCalledWith(mockUser.id, {
      correlationId,
    });
    expect(mockAuthService.hashPassword).toHaveBeenCalledWith(payload.password);
    expect(mockUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'new-hash' }),
      { correlationId }
    );
    expect(mockEventBus.publish).toHaveBeenCalled();

    // Verify it passes enriched events
    const publishedArgs = (mockEventBus.publish as jest.Mock).mock
      .calls[0][0] as IEvent<IUser>[];
    expect(publishedArgs[0].correlationId).toBe(correlationId);
    expect(publishedArgs[0].idempotencyKey).toBe(idempotencyKey);
  });
});
