import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting-entity/types/accounting-entity.types';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import { mockAccountingEntityRepo } from '../../../../infra/persistence/repos/__mocks__/accounting-entity.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import {
  ErrorBadRequest,
  ErrorResourceNotFound,
  ErrorUnprocessableEntity,
} from '../../../../shared/value-objects/error';
import MockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import setupNonPowerUserPostingAccountsUseCase from '../setup-non-power-user-posting-accounts.usecase';

describe('setupNonPowerUserPostingAccountsUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockLedgerAccountRepo.findByCode.mockImplementation(
      async (code: string) => {
        let type;
        if (code.startsWith('1')) type = 'asset';
        if (code.startsWith('2')) type = 'liability';
        if (code.startsWith('3')) type = 'equity';
        if (code.startsWith('4')) type = 'revenue';
        if (code.startsWith('5')) type = 'expense';
        return {
          id: '333e4567-e89b-12d3-a456-426614174000' as TEntityId,
          code,
          type,
          materializedPath: code,
        } as unknown as ILedgerAccount;
      }
    );
    mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
    mockLedgerAccountRepo.findByBehavior.mockImplementation(
      async (entityId, behavior) => {
        let code = '201002'; // default liability
        if (behavior === 'statutory_receivable') {
          code = '102002'; // Asset receivable
        }
        return [
          {
            id: '333e4567-e89b-12d3-a456-426614174000' as TEntityId,
            code,
            materializedPath: `root.${code}`,
          } as unknown as ILedgerAccount,
        ];
      }
    );
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
      ownerId: '223e4567-e89b-12d3-a456-426614174000' as TEntityId,
      type: EAccountingEntityType.Individual,
      functionalCurrency: { code: 'USD' },
    } as unknown as IAccountingEntity;

    mockAccountingEntityRepo.findById.mockResolvedValue(mockAccountingEntity);

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
    expect(mockLedgerAccountRepo.save).toHaveBeenCalledTimes(1);
    const savedAccounts = (mockLedgerAccountRepo.save as jest.Mock).mock
      .calls[0][0];
    expect(savedAccounts.length).toBeGreaterThan(0);
    expect((mockLedgerAccountRepo.save as jest.Mock).mock.calls[0][1]).toEqual({
      correlationId,
    });

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
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
      ownerId: '223e4567-e89b-12d3-a456-426614174000' as TEntityId,
      type: EAccountingEntityType.Company,
      functionalCurrency: { code: 'USD' },
    } as unknown as IAccountingEntity;

    mockAccountingEntityRepo.findById.mockResolvedValue(mockAccountingEntity);

    const usecase = setupNonPowerUserPostingAccountsUseCase(
      MockRequestContext,
      mockLedgerAccountRepo,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await expect(usecase(accountingEntityId)).rejects.toThrow(ErrorBadRequest);
    expect(mockAccountingEntityRepo.findById).toHaveBeenCalledTimes(1);
  });
});
