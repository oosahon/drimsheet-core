import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import {
  EExchangeRateType,
  IExchangeRate,
} from '../../../../domain/currency/types/exchange-rate.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import openingBalanceEquityLedgerEntity from '../../../../domain/ledger/entities/03-equity-account/99-opening-balance-equity.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/types/asset-account.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import mockBookkeepingServices from '../../../../infra/services/__mocks__/bookkeeping.service.mock';
import mockRequestContext, {
  mockClientSession,
} from '../../../../infra/services/__mocks__/request-context.mock';
import mockCurrencyDomainServices from '../../../../infra/services/domain/__mocks__/currency.domain.service.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import ledgerAppError from '../../../ledger/errors/ledger.error';
import { IRequestContextData } from '../../../shared/contracts/request-context.contract';
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

    mockBookkeepingServices.openingBalanceEntry.create.mockResolvedValue(
      journalEntryEntity.make({
        accountingEntityId: mockAccountingEntity.id,
        sourceType: EJournalEntrySourceType.OpeningBalance,
        counterPartyId: null,
        status: EJournalEntryStatus.Posted,
        effectiveDate: new Date(),
        postedAt: new Date(),
        voidedAt: null,
        voidingEntryId: null,
        memo: 'Opening balance',
        createdBy: mockUser.id,
        functionalCurrency: SYSTEM_CURRENCIES.NGN,
        lines: [
          {
            accountId: mockAssetAccount.id,
            sequenceOrder: 1,
            amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
            exchangeRate: null,
            side: EJournalSide.Debit,
            description: 'Opening balance',
            functionalCurrency: SYSTEM_CURRENCIES.NGN,
          },
          {
            accountId: mockEquityAccount.id,
            sequenceOrder: 2,
            amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
            exchangeRate: null,
            side: EJournalSide.Credit,
            description: 'Opening balance',
            functionalCurrency: SYSTEM_CURRENCIES.NGN,
          },
        ],
      })
    );
    mockCurrencyDomainServices.exchangeRate.getExchangeRate.mockResolvedValue(
      null
    );
  });

  const getUseCase = () =>
    makeRecordOpeningBalanceUseCase(
      mockRequestContext,
      mockLedgerAccountRepo,
      mockEventBus,
      mockBookkeepingServices.openingBalanceEntry,
      mockBookkeepingServices.journalEntryPersistence,
      mockCurrencyDomainServices.exchangeRate
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
      mockBookkeepingServices.openingBalanceEntry.create
    ).toHaveBeenCalledWith(
      mockAccountingEntity,
      mockAssetAccount,
      expect.objectContaining({
        amount: 1000n,
        currency: SYSTEM_CURRENCIES.NGN,
      }),
      null,
      { correlationId }
    );
    expect(
      mockBookkeepingServices.journalEntryPersistence.create
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        accountingEntityId: mockAccountingEntity.id,
      }),
      expect.objectContaining({
        correlationId,
      }),
      expect.arrayContaining([
        expect.objectContaining({
          correlationId,
        }),
      ]),
      { correlationId }
    );
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

    mockCurrencyDomainServices.exchangeRate.getExchangeRate.mockResolvedValue(
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
      mockCurrencyDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenCalledWith(payload.exchangeRate, { correlationId });
    expect(
      mockBookkeepingServices.journalEntryPersistence.create
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        accountingEntityId: mockAccountingEntity.id,
      }),
      expect.objectContaining({
        correlationId,
      }),
      expect.any(Array),
      { correlationId }
    );
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
