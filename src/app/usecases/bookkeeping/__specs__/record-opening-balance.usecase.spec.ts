import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import {
  EExchangeRateType,
  IExchangeRate,
} from '../../../../domain/currency/types/exchange-rate.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import openingBalanceEquityLedgerEntity from '../../../../domain/ledger/entities/03-equity-account/99-opening-balance-equity.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/types/asset-account.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockJournalEntryRepo from '../../../../infra/persistence/repos/__mocks__/journal-entry.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import mockDomainServices from '../../../../infra/services/__mocks__/domain.service.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import mockRequestContext, {
  mockClientSession,
} from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import ledgerAppError from '../../../errors/ledger.error';
import makeRecordOpeningBalanceUseCase from '../record-opening-balance.usecase';

describe('recordOpeningBalanceUseCase', () => {
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
    ownerId: mockUser.id,
    type: EAccountingEntityType.Individual,
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
  });

  const [mockAssetAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Cash',
      accountingEntityId: mockAccountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy: mockUser.id,
    },
    { precedingCode: '100000', parentMaterializedPath: '100000' }
  );

  const [mockEquityAccount] = openingBalanceEquityLedgerEntity.make(
    {
      name: 'Opening Balance Equity',
      accountingEntityId: mockAccountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      createdBy: mockUser.id,
    },
    { precedingCode: '399000', parentMaterializedPath: '399000' }
  );

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    mockLedgerAccountRepo.findById.mockResolvedValueOnce(mockAssetAccount);

    mockDomainServices.bookkeeping.createOpeningBalanceJournalEntry.mockResolvedValue(
      [{ id: 'mock-journal-entry-id' } as any, []]
    );
    mockDomainServices.exchangeRate.getExchangeRate.mockResolvedValue(null);
  });

  const getUseCase = () =>
    makeRecordOpeningBalanceUseCase(
      mockRequestContext,
      mockLedgerAccountRepo,
      mockJournalEntryRepo,
      mockEventBus,
      mockDomainServices.bookkeeping,
      mockDomainServices.exchangeRate
    );

  it('should successfully record opening balance', async () => {
    const useCase = getUseCase();

    const payload = {
      accountId: mockAssetAccount.id,
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
    };

    await useCase(payload);

    expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
      mockAssetAccount.id,
      { correlationId }
    );
    expect(
      mockDomainServices.bookkeeping.createOpeningBalanceJournalEntry
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        account: mockAssetAccount,
        accountingEntity: mockAccountingEntity,
      }),
      { correlationId }
    );
    expect(mockJournalEntryRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('should record opening balance with an exchange rate', async () => {
    const useCase = getUseCase();

    mockLedgerAccountRepo.findById
      .mockReset()
      .mockResolvedValueOnce(mockAssetAccount);

    const mockExchangeRate: IExchangeRate = {
      currencyPair: 'USD/NGN',
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1500,
      type: EExchangeRateType.Official,
      asOf: '2026-04-24T00:00:00.000Z' as unknown as Date,
      source: 'test',
      createdAt: new Date(),
    };

    mockDomainServices.exchangeRate.getExchangeRate.mockResolvedValue(
      mockExchangeRate
    );

    const payload = {
      accountId: mockAssetAccount.id,
      amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
      exchangeRate: {
        id: 1,
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1500,
        type: EExchangeRateType.Official,
        asOf: '2026-04-24T00:00:00.000Z' as unknown as Date,
        source: 'test',
      },
    };

    await useCase(payload);

    expect(
      mockDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenCalledWith(payload.exchangeRate, { correlationId });
    expect(mockJournalEntryRepo.save).toHaveBeenCalled();
  });

  it('should throw ErrorResourceNotFound if the account is not found', async () => {
    const useCase = getUseCase();

    mockLedgerAccountRepo.findById.mockReset().mockResolvedValue(null);

    const payload = {
      accountId: mockAssetAccount.id,
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
    };

    await expect(useCase(payload)).rejects.toThrow(
      ledgerAppError.AccountNotFound
    );
  });
});
