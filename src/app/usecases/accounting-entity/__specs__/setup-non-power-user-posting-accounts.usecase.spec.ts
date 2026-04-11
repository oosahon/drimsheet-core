import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting-entity/types/accounting-entity.types';
import ledgerService from '../../../../domain/ledger/services/ledger.service';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import { mockAccountingEntityRepo } from '../../../../infra/persistence/repos/__mocks__/accounting-entity.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import {
  ErrorBadRequest,
  ErrorResourceNotFound,
  ErrorUnprocessableEntity,
} from '../../../../shared/value-objects/error';
import MockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import setupNonPowerUserPostingAccountsUseCase from '../setup-non-power-user-posting-accounts.usecase';

jest.mock('../../../../domain/ledger/services/ledger.service');

const mockLedgerService = ledgerService as jest.MockedFunction<
  typeof ledgerService
>;

describe('setupNonPowerUserPostingAccountsUseCase', () => {
  const mockBootstrapFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockLedgerService.mockReturnValue({
      bootstrapNonPowerUserPostingAccounts: mockBootstrapFn,
      setupBaseIndividualAccounts: jest.fn(),
    });
  });

  it('should successfully setup non-power user posting accounts', async () => {
    const correlationId = 'test-corr-id';
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174000' as TEntityId;

    MockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const mockAccountingEntity = {
      id: accountingEntityId,
      type: EAccountingEntityType.Individual,
    } as IAccountingEntity;

    mockAccountingEntityRepo.findById.mockResolvedValue(mockAccountingEntity);

    const mockAccount = {
      id: 'account-1' as TEntityId,
    } as unknown as ILedgerAccount;
    const mockEvent = {
      type: 'mock.event',
      data: mockAccount,
      occurredAt: new Date(),
    } as unknown as IEvent<ILedgerAccount>;

    mockBootstrapFn.mockResolvedValue([[mockAccount, [mockEvent]]]);

    const usecase = setupNonPowerUserPostingAccountsUseCase(
      MockRequestContext,
      mockLedgerAccountRepo,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await usecase(accountingEntityId);

    expect(MockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(mockAccountingEntityRepo.findById).toHaveBeenCalledWith(
      accountingEntityId,
      { correlationId }
    );
    expect(mockLedgerService).toHaveBeenCalledWith(mockLedgerAccountRepo);
    expect(mockBootstrapFn).toHaveBeenCalledWith(mockAccountingEntity, {
      correlationId,
    });
    expect(mockLedgerAccountRepo.save).toHaveBeenCalledWith([mockAccount], {
      correlationId,
    });
    expect(mockEventBus.publish).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'mock.event',
        correlationId,
      }),
    ]);
  });

  it('should throw validation error if accountingEntityId is invalid', async () => {
    const usecase = setupNonPowerUserPostingAccountsUseCase(
      MockRequestContext,
      mockLedgerAccountRepo,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await expect(usecase('invalid-id' as TEntityId)).rejects.toThrow(
      ErrorUnprocessableEntity
    );

    expect(MockRequestContext.get).not.toHaveBeenCalled();
    expect(mockAccountingEntityRepo.findById).not.toHaveBeenCalled();
  });

  it('should throw ErrorResourceNotFound if accounting entity is not found', async () => {
    const correlationId = 'test-corr-id';
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174000' as TEntityId;

    MockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    mockAccountingEntityRepo.findById.mockResolvedValue(null);

    const usecase = setupNonPowerUserPostingAccountsUseCase(
      MockRequestContext,
      mockLedgerAccountRepo,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await expect(usecase(accountingEntityId)).rejects.toThrow(
      ErrorResourceNotFound
    );
    expect(mockAccountingEntityRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockLedgerService).not.toHaveBeenCalled();
  });

  it('should throw ErrorBadRequest if accounting entity type is not Individual', async () => {
    const correlationId = 'test-corr-id';
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174000' as TEntityId;

    MockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const mockAccountingEntity = {
      id: accountingEntityId,
      type: EAccountingEntityType.Company,
    } as IAccountingEntity;

    mockAccountingEntityRepo.findById.mockResolvedValue(mockAccountingEntity);

    const usecase = setupNonPowerUserPostingAccountsUseCase(
      MockRequestContext,
      mockLedgerAccountRepo,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await expect(usecase(accountingEntityId)).rejects.toThrow(ErrorBadRequest);
    expect(mockAccountingEntityRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockLedgerService).not.toHaveBeenCalled();
  });
});
