import mockEventBus from '@shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '@shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import accountingEntityEntity from '@domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '@domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '@domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import makeCashAccountService from '@domain/ledger/services/asset-account/cash-account.service';
import makeEquityAccountService from '@domain/ledger/services/equity-account/equity-account.service';
import { ICashAndCashEquivalentAccount } from '@domain/ledger/types/asset-account.types';
import { IOpeningBalanceEquityAccount } from '@domain/ledger/types/equity-account.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import { EExchangeRateType } from '@domain/money/types/exchange-rate.types';
import { IUser } from '@domain/user/types/user.types';

import mockAppContext, {
  mockClientSession,
} from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import mockJournalEntryPersistenceService from '@app/journal-entry/contracts/__mocks__/journal-entry-persistence.service.mock';
import mockJournalEntryService from '@app/journal-entry/contracts/__mocks__/journal-entry.service.mock';
import makeCreateOpeningBalanceUseCase from '@app/journal-entry/usecases/create-opening-balance.usecase';
import mockLedgerAccountBalanceAdjustmentQueue from '@app/ledger/contracts/__mocks__/ledger-balance-adjustment-queue.mock';
import { mockLedgerAccountRepo } from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import mockOutboxService from '@app/outbox/contracts/__mocks__/outbox.service.mock';

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

  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const equityAccountService = makeEquityAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  let mockAssetAccount: ICashAndCashEquivalentAccount;
  let mockEquityAccount: IOpeningBalanceEquityAccount;

  beforeAll(async () => {
    const [controlAccount] = await cashAccountService.createHeader(
      {
        name: 'Cash and Cash Equivalents',
        accountingEntity: mockAccountingEntity,
        userId: mockUser.id,
      },
      { correlationId }
    );
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    [mockAssetAccount] = await cashAccountService.createPettyCashSubAccount(
      {
        name: 'Cash',
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountCode: controlAccount.code,
        accountingEntity: mockAccountingEntity,
        userId: mockUser.id,
      },
      { correlationId }
    );
    [mockEquityAccount] =
      await equityAccountService.createOpeningBalanceAccount(
        {
          name: 'Opening Balance Equity',
          accountingEntity: mockAccountingEntity,
          createdBy: mockUser.id,
        },
        { correlationId }
      );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );
    mockOutboxService.createBalancePropagation.mockReset().mockResolvedValue();
    mockLedgerAccountBalanceAdjustmentQueue.add.mockReset().mockResolvedValue();

    mockAppContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IAppContextData);

    mockLedgerAccountRepo.findById.mockResolvedValueOnce(mockAssetAccount);

    mockJournalEntryService.createOpeningBalance.mockResolvedValue(
      journalEntryEntity.make({
        accountingEntityId: mockAccountingEntity.id,
        sourceType: EJournalEntrySourceType.OpeningBalance,
        effectiveDate: new Date('2026-04-24T00:00:00.000Z'),
        postedAt: new Date('2026-04-24T00:00:00.000Z'),
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
      journalEntryService: mockJournalEntryService,
      journalEntryPersistenceService: mockJournalEntryPersistenceService,
      outboxService: mockOutboxService,
      ledgerBalanceAdjustmentQueue: mockLedgerAccountBalanceAdjustmentQueue,
      repoService: mockRepoService,
    });

  it('should successfully record opening balance and update account openingBalanceDate', async () => {
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
      mockAccountingEntity.id,
      { correlationId }
    );
    expect(mockJournalEntryService.createOpeningBalance).toHaveBeenCalledWith(
      {
        accountingEntityId: mockAccountingEntity.id,
        functionalCurrencyCode: mockAccountingEntity.functionalCurrencyCode,
        account: mockAssetAccount,
        amount: expect.objectContaining({
          amount: 1000n,
          currency: SYSTEM_CURRENCIES.NGN,
        }),
        effectiveDate: payload.date,
        exchangeRate: null,
        createdBy: mockAssetAccount.createdBy,
      },
      { correlationId }
    );
    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockLedgerAccountRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockAssetAccount.id,
        openingBalanceDate: payload.date,
      }),
      expect.objectContaining({
        correlationId,
      })
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
      expect.objectContaining({ correlationId })
    );
    const persistedJournalEntry =
      mockJournalEntryPersistenceService.create.mock.calls[0][0];
    expect(mockOutboxService.createBalancePropagation).toHaveBeenCalledWith(
      persistedJournalEntry.id,
      expect.objectContaining({ correlationId, tx: expect.anything() })
    );
    expect(mockLedgerAccountBalanceAdjustmentQueue.add).toHaveBeenCalledWith({
      journalEntryId: persistedJournalEntry.id,
      correlationId,
    });
    expect(
      mockRepoService.runInTransaction.mock.invocationCallOrder[0]
    ).toBeLessThan(
      mockLedgerAccountBalanceAdjustmentQueue.add.mock.invocationCallOrder[0]
    );
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('should record opening balance with an exchange rate', async () => {
    const useCase = getUseCase();

    mockLedgerAccountRepo.findById
      .mockReset()
      .mockResolvedValueOnce(mockAssetAccount);

    const payload = {
      accountId: mockAssetAccount.id,
      amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
      exchangeRate: {
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1500,
        type: EExchangeRateType.Official,
        asOf: new Date('2026-04-24T00:00:00.000Z'),
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
      expect.objectContaining({ correlationId })
    );
  });

  it('persists a non-posted opening-balance journal without queueing balance work', async () => {
    const [journalEntry, journalEvents, audit] = journalEntryEntity.make({
      accountingEntityId: mockAccountingEntity.id,
      sourceType: EJournalEntrySourceType.OpeningBalance,
      effectiveDate: new Date('2026-04-24T00:00:00.000Z'),
      postedAt: null,
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
    });
    mockJournalEntryService.createOpeningBalance.mockResolvedValueOnce([
      {
        ...journalEntry,
        status: EJournalEntryStatus.Draft,
      },
      journalEvents,
      audit,
    ]);

    await getUseCase()({
      accountId: mockAssetAccount.id,
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
      date: new Date('2026-04-24T00:00:00.000Z'),
    });

    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalled();
    expect(mockOutboxService.createBalancePropagation).not.toHaveBeenCalled();
    expect(mockLedgerAccountBalanceAdjustmentQueue.add).not.toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('should not persist or publish events when opening balance entry creation fails', async () => {
    const useCase = getUseCase();

    mockJournalEntryService.createOpeningBalance.mockRejectedValueOnce(
      new Error('Entry creation failed')
    );

    const payload = {
      accountId: mockAssetAccount.id,
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
      date: new Date('2026-04-24T00:00:00.000Z'),
    };

    await expect(useCase(payload)).rejects.toThrow('Entry creation failed');

    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockLedgerAccountRepo.update).not.toHaveBeenCalled();
    expect(mockJournalEntryPersistenceService.create).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
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
