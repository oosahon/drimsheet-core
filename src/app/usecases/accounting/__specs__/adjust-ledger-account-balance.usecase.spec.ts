import accountingEntityEntity from '../../../../domain/accounting-entity/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting-entity/types/accounting-entity.types';
import ledgerAccountBalanceEntity from '../../../../domain/accounting/entities/ledger-account-balance.entity';
import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/types/asset-account.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockLedgerAccountBalanceRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account-balance.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import { ILedgerAccountBalanceAdjustmentDto } from '../../../contracts/dto/workers.dto';
import IQueue from '../../../contracts/infra/queues.contract';
import makeAdjustLedgerAccountBalanceUseCase from '../adjust-ledger-account-balance.usecase';

describe('makeAdjustLedgerAccountBalanceUseCase', () => {
  const correlationId = 'test-corr-id';

  const mockUser: IUser = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const [mockAccountingEntity] = accountingEntityEntity.make({
    name: 'Test Accounting Entity',
    operatingCountryCode: 'NG',
    ownerId: mockUser.id,
    type: EAccountingEntityType.Individual,
    functionalCurrency: SYSTEM_CURRENCIES.NGN,
    reportingCurrency: SYSTEM_CURRENCIES.USD,
    fiscalYearStart: { month: 1, day: 1 },
  });

  const [mockAssetAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Cash',
      accountingEntityId: mockAccountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy: mockUser.id,
    },
    { precedingCode: '100000', parentMaterializedPath: '100000' }
  );

  const [mockAssetAccountWithControl] = cashAndEquivalentAccountEntity.make(
    {
      name: 'USD Cash Subaccount',
      accountingEntityId: mockAccountingEntity.id,
      currency: SYSTEM_CURRENCIES.USD,
      isControlAccount: false,
      controlAccountId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy: mockUser.id,
    },
    { precedingCode: '100000', parentMaterializedPath: '100000' }
  );

  const mockExistingBalance = ledgerAccountBalanceEntity.make({
    ledgerAccountId: mockAssetAccount.id,
    accountingEntityId: mockAccountingEntity.id,
    accountMaterializedPath: mockAssetAccount.materializedPath,
    currencyCode: SYSTEM_CURRENCIES.NGN.code,
    functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
  });

  const mockExistingBalanceWithControl = ledgerAccountBalanceEntity.make({
    ledgerAccountId: mockAssetAccountWithControl.id,
    accountingEntityId: mockAccountingEntity.id,
    accountMaterializedPath: mockAssetAccountWithControl.materializedPath,
    currencyCode: SYSTEM_CURRENCIES.USD.code,
    functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
  });

  const mockQueue: IQueue = {
    addLedgerAccountBalanceAdjustment: jest.fn(),
  } as unknown as IQueue;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLedgerAccountRepo.findById.mockResolvedValue(mockAssetAccount);
    mockLedgerAccountBalanceRepo.findBalanceByAccountId.mockResolvedValue(
      mockExistingBalance
    );
  });

  const getUseCase = () =>
    makeAdjustLedgerAccountBalanceUseCase(
      mockLedgerAccountRepo,
      mockLedgerAccountBalanceRepo,
      mockQueue
    );

  const validPayload: ILedgerAccountBalanceAdjustmentDto = {
    correlationId,
    journalEntry: {
      id: '123e4567-e89b-12d3-a456-426614174010' as TEntityId,
      transactionId: '123e4567-e89b-12d3-a456-426614174011' as TEntityId,
      createdBy: mockUser.id,
    },
    balanceDelta: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
    functionalBalanceDelta: {
      amount: 1000,
      currencyCode: 'NGN',
      isMinorUnit: true,
    },
    ledgerAccountId: mockAssetAccount.id,
  };

  it('should successfully adjust balance for same currency account', async () => {
    const useCase = getUseCase();

    await useCase(validPayload);

    expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
      mockAssetAccount.id,
      { correlationId }
    );
    expect(
      mockLedgerAccountBalanceRepo.findBalanceByAccountId
    ).toHaveBeenCalledWith(
      mockAssetAccount.id,
      mockAssetAccount.accountingEntityId,
      { correlationId }
    );
    expect(mockLedgerAccountBalanceRepo.adjustBalance).toHaveBeenCalledWith(
      expect.objectContaining({
        adjustment: expect.objectContaining({
          ledgerAccountId: mockAssetAccount.id,
          journalEntryId: validPayload.journalEntry.id,
          transactionId: validPayload.journalEntry.transactionId,
        }),
      }),
      { correlationId, expectedVersion: mockExistingBalance.version }
    );
    expect(mockQueue.addLedgerAccountBalanceAdjustment).not.toHaveBeenCalled();
  });

  it('should successfully adjust balance for different currency account and propagate adjustment', async () => {
    const useCase = getUseCase();

    mockLedgerAccountRepo.findById
      .mockReset()
      .mockResolvedValue(mockAssetAccountWithControl);
    mockLedgerAccountBalanceRepo.findBalanceByAccountId
      .mockReset()
      .mockResolvedValue(mockExistingBalanceWithControl);

    const payloadWithControl: ILedgerAccountBalanceAdjustmentDto = {
      ...validPayload,
      ledgerAccountId: mockAssetAccountWithControl.id,
      balanceDelta: { amount: 500, currencyCode: 'USD', isMinorUnit: true },
      functionalBalanceDelta: {
        amount: 750000,
        currencyCode: 'NGN',
        isMinorUnit: true,
      },
    };

    await useCase(payloadWithControl);

    expect(mockLedgerAccountBalanceRepo.adjustBalance).toHaveBeenCalledWith(
      expect.objectContaining({
        adjustment: expect.objectContaining({
          amount: { amount: 500n, currency: SYSTEM_CURRENCIES.USD },
          functionalAmount: {
            amount: 750000n,
            currency: SYSTEM_CURRENCIES.NGN,
          },
        }),
      }),
      { correlationId, expectedVersion: mockExistingBalanceWithControl.version }
    );

    expect(mockQueue.addLedgerAccountBalanceAdjustment).toHaveBeenCalledWith({
      ...payloadWithControl,
      ledgerAccountId: mockAssetAccountWithControl.controlAccountId,
    });
  });

  it('should successfully adjust balance when currencies differ (isSameCurrency = false)', async () => {
    const useCase = getUseCase();

    // Mock finding the NGN control account
    mockLedgerAccountRepo.findById
      .mockReset()
      .mockResolvedValue(mockAssetAccount); // NGN account
    mockLedgerAccountBalanceRepo.findBalanceByAccountId
      .mockReset()
      .mockResolvedValue(mockExistingBalance); // NGN balance

    const foreignPayload: ILedgerAccountBalanceAdjustmentDto = {
      ...validPayload,
      ledgerAccountId: mockAssetAccount.id,
      balanceDelta: { amount: 500, currencyCode: 'USD', isMinorUnit: true }, // Foreign currency payload
      functionalBalanceDelta: {
        amount: 750000,
        currencyCode: 'NGN',
        isMinorUnit: true,
      },
    };

    await useCase(foreignPayload);

    // Should use the functional amount for both amount and functionalAmount
    expect(mockLedgerAccountBalanceRepo.adjustBalance).toHaveBeenCalledWith(
      expect.objectContaining({
        adjustment: expect.objectContaining({
          amount: { amount: 750000n, currency: SYSTEM_CURRENCIES.NGN },
          functionalAmount: {
            amount: 750000n,
            currency: SYSTEM_CURRENCIES.NGN,
          },
        }),
      }),
      { correlationId, expectedVersion: mockExistingBalance.version }
    );
  });

  it('should throw AppError if account is not found', async () => {
    const useCase = getUseCase();

    mockLedgerAccountRepo.findById.mockReset().mockResolvedValue(null);

    await expect(useCase(validPayload)).rejects.toThrow('Account not found');
  });

  it('should throw AppError if balance is not found for account', async () => {
    const useCase = getUseCase();

    mockLedgerAccountBalanceRepo.findBalanceByAccountId
      .mockReset()
      .mockResolvedValue(null);

    await expect(useCase(validPayload)).rejects.toThrow(
      'Balance not found for account'
    );
  });

  it('should fail validation if payload is invalid', async () => {
    const useCase = getUseCase();

    const invalidPayload = {
      ...validPayload,
      ledgerAccountId: 'invalid-uuid',
    };

    await expect(
      useCase(invalidPayload as unknown as ILedgerAccountBalanceAdjustmentDto)
    ).rejects.toThrow();
  });
});
