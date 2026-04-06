import signupWithEmailUsecase from '../signup-with-email.usecase';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting.types';
import {
  ErrorConflict,
  ErrorForbidden,
} from '../../../../shared/value-objects/error';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import mockDbService from '../../../../infra/services/__mocks__/repo.service.mock';
import mockUserRepo from '../../../../infra/persistence/repos/__mocks__/user.repo.impl.mock';
import mockAccountingEntityRepo from '../../../../infra/persistence/repos/__mocks__/accounting-entity.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import { IUser } from '../../../../domain/user/types/user.types';
import { ITransactionContext } from '../../../contracts/infra/repo.contract';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import { NAIRA } from '../../../bootstrap/data/currencies';

describe('signupWithEmailUsecase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully sign up a new user and create an individual accounting domain', async () => {
    const correlationId = 'test-corr-id';
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
      reportingCurrency: NAIRA,
    };

    mockAuthService.isPermittedEmail.mockReturnValue(true);

    const mockTx = { txId: 'tx-1' };
    mockDbService.runInTransaction.mockImplementation(async (cb) => {
      return await cb(mockTx as unknown as ITransactionContext);
    });

    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockAuthService.hashPassword.mockResolvedValue('hashed-password');

    const usecase = signupWithEmailUsecase(
      mockDbService,
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await usecase(payload);

    expect(mockRequestContext.get).toHaveBeenCalledTimes(1);

    // Check if user was searched by email
    const email = emailValue.make(payload.email);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(email, {
      correlationId,
    });

    expect(mockAuthService.hashPassword).toHaveBeenCalledTimes(1);
    expect(mockDbService.runInTransaction).toHaveBeenCalledTimes(1);

    // Assert that save methods were called correctly within the transaction
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    const savedUserArgs = mockUserRepo.save.mock.calls[0];
    expect(savedUserArgs[0]).toMatchObject({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email,
      emailVerified: false,
      password: 'hashed-password',
    });
    expect(savedUserArgs[1]).toEqual({ tx: mockTx, correlationId });

    expect(mockAccountingEntityRepo.save).toHaveBeenCalledTimes(1);
    const savedDomainArgs = mockAccountingEntityRepo.save.mock.calls[0];
    expect(savedDomainArgs[0]).toMatchObject({
      type: EAccountingEntityType.Individual,
      ownerId: expect.any(String),
      functionalCurrency: expect.objectContaining({
        code: 'NGN',
      }),
    });
    expect(savedDomainArgs[1]).toEqual({ tx: mockTx, correlationId });

    expect(mockEventBus.publish).toHaveBeenCalled();
    const publishCalls = (mockEventBus.publish as jest.Mock).mock.calls;
    expect(publishCalls.length).toBeGreaterThan(0);
    publishCalls.forEach(([event]) => {
      expect(event).toMatchObject({
        correlationId,
        idempotencyKey,
      });
    });
  });

  it('should throw ErrorConflict if user already exists', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as unknown as IRequestContextData);

    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'janedoe@example.com',
      password: 'SecurePassword123!',
      reportingCurrency: {
        code: 'NGN',
        name: 'Naira',
        symbol: '₦',
        minorUnit: 100n,
      },
    };

    mockAuthService.isPermittedEmail.mockReturnValue(true);

    mockUserRepo.findByEmail.mockResolvedValue({
      id: 'existing-user-id',
    } as unknown as IUser);

    const usecase = signupWithEmailUsecase(
      mockDbService,
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await expect(usecase(payload)).rejects.toThrow(ErrorConflict);
    await expect(usecase(payload)).rejects.toThrow('User already exists');

    expect(mockUserRepo.findByEmail).toHaveBeenCalledTimes(2); // Since we called it twice in expect
    expect(mockAuthService.hashPassword).not.toHaveBeenCalled();
    expect(mockDbService.runInTransaction).not.toHaveBeenCalled();
  });

  it('should throw ErrorForbidden if email is not permitted', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as unknown as IRequestContextData);

    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'notpermitted@example.com',
      password: 'SecurePassword123!',
      reportingCurrency: {
        code: 'NGN',
        name: 'Naira',
        symbol: '₦',
        minorUnit: 100n,
      },
    };

    mockAuthService.isPermittedEmail.mockReturnValue(false);

    const usecase = signupWithEmailUsecase(
      mockDbService,
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await expect(usecase(payload)).rejects.toThrow(ErrorForbidden);
    await expect(usecase(payload)).rejects.toThrow('Email is not permitted');

    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
    expect(mockAuthService.hashPassword).not.toHaveBeenCalled();
    expect(mockDbService.runInTransaction).not.toHaveBeenCalled();
  });
});
