import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/asset-account/types/asset-account.types';
import openingBalanceEquityLedgerEntity from '../../../../domain/ledger/equity-account/entities/opening-balance-equity.entity';
import mockLedgerAccountRepo from '../../../../domain/ledger/shared/repos/__mocks__/ledger-account.repo.impl.mock';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import {
  EExchangeRateType,
  IExchangeRate,
} from '../../../../domain/money/types/exchange-rate.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.contract.mock';
import mockJournalEntryPersistenceService from '../../../bookkeeping/contracts/__mocks__/journal-entry-persistence.service.contract.mock';
import mockOpeningBalanceEntryService from '../../../bookkeeping/contracts/__mocks__/opening-balance-entry.service.contract.mock';

import { TEntityId } from '../../../../shared/types/uuid';
import mockAppContext, {
  mockClientSession,
} from '../../../_internal/contracts/__mocks__/app-context.contract.mock';
import { IAppContextData } from '../../../_internal/contracts/app-context.contract';
import ledgerAppError from '../../../ledger/errors/ledger.error';
import makeCreateOpeningBalanceUseCase from '../create-opening-balance.usecase';

describe('createOpeningBalanceUseCase', () => {
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

    mockAppContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IAppContextData);

    mockLedgerAccountRepo.findById.mockResolvedValueOnce(mockAssetAccount);

    mockOpeningBalanceEntryService.create.mockResolvedValue(
      journalEntryEntity.make({
        accountingEntityId: mockAccountingEntity.id,
        sourceType: EJournalEntrySourceType.OpeningBalance,
        counterPartyId: null,
        status: EJournalEntryStatus.Posted,
        effectiveDate: new Date('2026-04-24T00:00:00.000Z'),
        postedAt: new Date('2026-04-24T00:00:00.000Z'),
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
  });

  const getUseCase = () =>
    makeCreateOpeningBalanceUseCase({
      appContext: mockAppContext,
      ledgerAccountRepo: mockLedgerAccountRepo,
      eventBus: mockEventBus,
      openingBalanceEntryService: mockOpeningBalanceEntryService,
      journalEntryPersistenceService: mockJournalEntryPersistenceService,
    });

  it('should successfully record opening balance', async () => {
    const useCase = getUseCase();

    const payload = {
      accountId: mockAssetAccount.id,
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
      date: new Date('2026-04-24T00:00:00.000Z'),
    };

    await useCase(payload);

    expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
      mockAssetAccount.id,
      { correlationId }
    );
    expect(mockOpeningBalanceEntryService.create).toHaveBeenCalledWith(
      mockAccountingEntity,
      mockAssetAccount,
      expect.objectContaining({
        amount: 1000n,
        currency: SYSTEM_CURRENCIES.NGN,
      }),
      payload.date,
      null,
      { correlationId }
    );
    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalledWith(
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

    const payload = {
      accountId: mockAssetAccount.id,
      amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
      exchangeRate: {
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1500,
        type: EExchangeRateType.Official,
        asOf: '2026-04-24T00:00:00.000Z' as unknown as Date,
        source: 'test',
      },
      date: new Date('2026-04-24T00:00:00.000Z'),
    };

    await useCase(payload);

    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalledWith(
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
      date: new Date('2026-04-24T00:00:00.000Z'),
    };

    await expect(useCase(payload)).rejects.toThrow(
      ledgerAppError.AccountNotFound
    );
  });
});
