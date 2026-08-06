import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import makeCounterpartyService from '../../../../domain/counterparty/services/counterparty.service';
import { ECounterpartyType } from '../../../../domain/counterparty/types/counterparty.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import { EJournalEntrySourceType } from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/asset-account/types/asset-account.types';
import servicesAccountEntity from '../../../../domain/ledger/revenue-account/entities/services.entity';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import mockAppContext, {
  mockClientSession,
} from '../../../context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '../../../context/contracts/app-context.contract';
import mockCounterpartyAppService from '../../../counterparty/contracts/__mocks__/counterparty.service.mock';
import mockCounterpartyPersistenceService from '../../../counterparty/contracts/__mocks__/persistence.service.mock';
import { ICounterpartyFindOrCreateRes } from '../../../counterparty/contracts/counterparty.service.contract';
import mockLedgerAccountBalancePropagationService from '../../../ledger/contracts/__mocks__/ledger-account-balance-propagation.service.mock';
import { mockLedgerAccountRepo } from '../../../ledger/contracts/__mocks__/ledger.repos.mock';
import ledgerAppError from '../../../ledger/errors/ledger.error';
import mockJournalEntryPersistenceService from '../../contracts/__mocks__/journal-entry-persistence.service.mock';
import mockJournalEntryService from '../../contracts/__mocks__/journal-entry.service.mock';
import journalEntryDtoMapper from '../../dtos/journal-entry/journal-entry.dto.mapper';
import makeCreateReceiptUsecase from '../create-receipt.usecase';

describe('makeCreateReceiptUsecase', () => {
  const correlationId = 'test-correlation-id';
  const idempotencyKey = 'test-idempotency-key';

  const user: IUser = {
    id: generateUUID(),
    email: 'user@example.com',
    emailVerified: true,
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const [accountingEntity] = accountingEntityEntity.make({
    name: 'Test Entity',
    ownerId: user.id,
    type: EAccountingEntityType.Individual,
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
  });

  const [sourceAccount] = servicesAccountEntity.make(
    {
      name: 'Services Revenue',
      accountingEntityId: accountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
      createdBy: user.id,
    },
    null
  );

  const [destinationAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Cash',
      accountingEntityId: accountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy: user.id,
    },
    null
  );

  const counterpartyService = makeCounterpartyService();
  const newCounterparty = counterpartyService.create({
    accountingEntityId: accountingEntity.id,
    name: 'Jane Doe',
    type: ECounterpartyType.Individual,
  });

  const existingCounterparty = counterpartyService.create({
    accountingEntityId: accountingEntity.id,
    name: 'Jane Doe',
    type: ECounterpartyType.Individual,
  });

  const counterpartyResponse: ICounterpartyFindOrCreateRes = {
    new: true,
    data: newCounterparty,
  };

  const existingCounterpartyResponse: ICounterpartyFindOrCreateRes = {
    new: false,
    data: existingCounterparty,
  };

  const [journalEntry, journalEntryEvents, journalEntryAudit] =
    journalEntryEntity.make({
      accountingEntityId: accountingEntity.id,
      sourceType: EJournalEntrySourceType.Receipt,
      effectiveDate: new Date('2026-08-06T00:00:00.000Z'),
      postedAt: new Date('2026-08-06T00:00:00.000Z'),
      memo: 'Receipt',
      createdBy: user.id,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: sourceAccount.id,
          counterpartyId: newCounterparty[0].id,
          sequenceOrder: 1,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: 'Revenue',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: destinationAccount.id,
          counterpartyId: newCounterparty[0].id,
          sequenceOrder: 2,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Cash',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppContext.get.mockReturnValue({
      correlationId,
      idempotencyKey,
      user,
      accountingEntity,
      clientSession: mockClientSession,
    } as IAppContextData);

    mockLedgerAccountRepo.findById.mockImplementation(async (id: TEntityId) => {
      if (id === sourceAccount.id) return sourceAccount;
      if (id === destinationAccount.id) return destinationAccount;
      return null;
    });

    const counterparties = new Map([['counterparty', counterpartyResponse]]);
    mockCounterpartyAppService.findOrCreateMany.mockResolvedValue(
      counterparties
    );
    mockCounterpartyAppService.getFoundOrCreated.mockReturnValue(
      counterpartyResponse
    );
    mockJournalEntryService.createReceipt.mockResolvedValue([
      journalEntry,
      journalEntryEvents,
      journalEntryAudit,
    ]);

    mockRepoService.runInTransaction.mockImplementation(async (transactionFn) =>
      transactionFn('mock-tx' as unknown as ITransactionContext)
    );
    mockLedgerAccountBalancePropagationService.propagate.mockResolvedValue();
    mockEventBus.publish.mockResolvedValue();
  });

  const getUseCase = () =>
    makeCreateReceiptUsecase({
      appContext: mockAppContext,
      counterpartyAppService: mockCounterpartyAppService,
      journalEntryService: mockJournalEntryService,
      ledgerAccountRepo: mockLedgerAccountRepo,
      counterpartyPersistenceService: mockCounterpartyPersistenceService,
      journalEntryPersistenceService: mockJournalEntryPersistenceService,
      repoService: mockRepoService,
      eventBus: mockEventBus,
      balancePropagationService: mockLedgerAccountBalancePropagationService,
    });

  it('successfully orchestrates receipt creation, persists changes, propagates balances and returns DTO', async () => {
    const usecase = getUseCase();

    const payload = {
      sourceLine: {
        accountId: sourceAccount.id,
        counterparty: { name: 'Jane Doe' },
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Revenue',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: destinationAccount.id,
          counterparty: { name: 'Jane Doe' },
          amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
          exchangeRate: null,
          description: 'Cash',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-08-06T00:00:00.000Z'),
      postedAt: new Date('2026-08-06T00:00:00.000Z'),
      memo: 'Receipt',
    };

    const result = await usecase(payload);

    expect(mockAppContext.get).toHaveBeenCalled();
    const trace = { correlationId, idempotencyKey };

    expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
      sourceAccount.id,
      accountingEntity.id,
      trace
    );
    expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
      destinationAccount.id,
      accountingEntity.id,
      trace
    );

    expect(mockCounterpartyAppService.findOrCreateMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        payload.sourceLine.counterparty,
        payload.destinationLines[0].counterparty,
      ]),
      accountingEntity.id,
      trace
    );

    expect(mockJournalEntryService.createReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        header: expect.objectContaining({
          accountingEntityId: accountingEntity.id,
          memo: payload.memo,
          effectiveDate: payload.effectiveDate,
          postedAt: payload.postedAt,
        }),
        sourceLine: expect.objectContaining({
          account: sourceAccount,
          counterparty: newCounterparty[0],
        }),
        destinationLines: expect.arrayContaining([
          expect.objectContaining({
            account: destinationAccount,
            counterparty: newCounterparty[0],
          }),
        ]),
      }),
      trace
    );

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockCounterpartyPersistenceService.create).toHaveBeenCalled();
    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalled();

    expect(
      mockLedgerAccountBalancePropagationService.propagate
    ).toHaveBeenCalledWith(journalEntry, trace);

    const [publishedEvents] = mockEventBus.publish.mock.calls[0];
    expect(publishedEvents).toEqual([
      expect.objectContaining({ type: 'domain:counterparty:created' }),
      expect.objectContaining({ type: 'domain:journal-entry:created' }),
      expect.objectContaining({ type: 'domain:journal-line-item:created' }),
      expect.objectContaining({ type: 'domain:journal-line-item:created' }),
    ]);

    expect(result).toEqual(journalEntryDtoMapper.toDto(journalEntry));
  });

  it('orchestrates successfully when findOrCreateMany returns only existing counterparties', async () => {
    const counterparties = new Map([
      ['counterparty', existingCounterpartyResponse],
    ]);
    mockCounterpartyAppService.findOrCreateMany.mockResolvedValue(
      counterparties
    );
    mockCounterpartyAppService.getFoundOrCreated.mockReturnValue(
      existingCounterpartyResponse
    );
    mockJournalEntryService.createReceipt.mockResolvedValue([
      journalEntry,
      [],
      journalEntryAudit,
    ]);

    const usecase = getUseCase();

    const payload = {
      sourceLine: {
        accountId: sourceAccount.id,
        counterparty: { name: 'Jane Doe' },
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Revenue',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: destinationAccount.id,
          counterparty: { name: 'Jane Doe' },
          amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
          exchangeRate: null,
          description: 'Cash',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-08-06T00:00:00.000Z'),
      postedAt: new Date('2026-08-06T00:00:00.000Z'),
      memo: 'Receipt',
    };

    await usecase(payload);

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockCounterpartyPersistenceService.create).not.toHaveBeenCalled();
    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalled();
  });

  it('rejects with AccountNotFound when source account is not found', async () => {
    const usecase = getUseCase();

    mockLedgerAccountRepo.findById.mockResolvedValue(null);

    const payload = {
      sourceLine: {
        accountId: generateUUID(),
        counterparty: { name: 'Jane Doe' },
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Revenue',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: destinationAccount.id,
          counterparty: { name: 'Jane Doe' },
          amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
          exchangeRate: null,
          description: 'Cash',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-08-06T00:00:00.000Z'),
      postedAt: new Date('2026-08-06T00:00:00.000Z'),
      memo: 'Receipt',
    };

    await expect(usecase(payload)).rejects.toThrow(
      ledgerAppError.AccountNotFound
    );

    expect(mockCounterpartyAppService.findOrCreateMany).not.toHaveBeenCalled();
    expect(mockJournalEntryService.createReceipt).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(
      mockLedgerAccountBalancePropagationService.propagate
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('rejects with AccountNotFound when destination account is not found', async () => {
    const usecase = getUseCase();

    mockLedgerAccountRepo.findById.mockImplementation(async (id: TEntityId) => {
      if (id === sourceAccount.id) return sourceAccount;
      return null;
    });

    const payload = {
      sourceLine: {
        accountId: sourceAccount.id,
        counterparty: { name: 'Jane Doe' },
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Revenue',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: generateUUID(),
          counterparty: { name: 'Jane Doe' },
          amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
          exchangeRate: null,
          description: 'Cash',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-08-06T00:00:00.000Z'),
      postedAt: new Date('2026-08-06T00:00:00.000Z'),
      memo: 'Receipt',
    };

    await expect(usecase(payload)).rejects.toThrow(
      ledgerAppError.AccountNotFound
    );

    expect(mockCounterpartyAppService.findOrCreateMany).toHaveBeenCalled();
    expect(mockJournalEntryService.createReceipt).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(
      mockLedgerAccountBalancePropagationService.propagate
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('rejects when journalEntryService.createReceipt fails and prevents side-effects', async () => {
    const usecase = getUseCase();

    mockJournalEntryService.createReceipt.mockRejectedValue(
      new Error('Domain Error')
    );

    const payload = {
      sourceLine: {
        accountId: sourceAccount.id,
        counterparty: { name: 'Jane Doe' },
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Revenue',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: destinationAccount.id,
          counterparty: { name: 'Jane Doe' },
          amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
          exchangeRate: null,
          description: 'Cash',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-08-06T00:00:00.000Z'),
      postedAt: new Date('2026-08-06T00:00:00.000Z'),
      memo: 'Receipt',
    };

    await expect(usecase(payload)).rejects.toThrow('Domain Error');

    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockCounterpartyPersistenceService.create).not.toHaveBeenCalled();
    expect(mockJournalEntryPersistenceService.create).not.toHaveBeenCalled();
    expect(
      mockLedgerAccountBalancePropagationService.propagate
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('successfully orchestrates receipt creation with exchange rates', async () => {
    const usecase = getUseCase();

    const payload = {
      sourceLine: {
        accountId: sourceAccount.id,
        counterparty: { name: 'Jane Doe' },
        amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: {
          baseCurrencyCode: 'USD',
          targetCurrencyCode: 'NGN',
          rate: 1.5,
          type: 'negotiated' as const,
          asOf: new Date('2026-08-06T00:00:00.000Z'),
          source: 'test-source',
        },
        description: 'Revenue',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: destinationAccount.id,
          counterparty: { name: 'Jane Doe' },
          amount: { amount: 1500, currencyCode: 'NGN', isMinorUnit: true },
          exchangeRate: {
            baseCurrencyCode: 'NGN',
            targetCurrencyCode: 'NGN',
            rate: 1.0,
            type: 'official' as const,
            asOf: new Date('2026-08-06T00:00:00.000Z'),
            source: 'test-source',
          },
          description: 'Cash',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-08-06T00:00:00.000Z'),
      postedAt: new Date('2026-08-06T00:00:00.000Z'),
      memo: 'Receipt',
    };

    await usecase(payload);

    expect(mockJournalEntryService.createReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceLine: expect.objectContaining({
          exchangeRate: expect.any(Object),
        }),
        destinationLines: expect.arrayContaining([
          expect.objectContaining({
            exchangeRate: expect.any(Object),
          }),
        ]),
      }),
      expect.any(Object)
    );
  });

  it('orchestrates successfully when counterparties are unresolved', async () => {
    mockCounterpartyAppService.getFoundOrCreated.mockReturnValue(undefined);

    const usecase = getUseCase();

    const payload = {
      sourceLine: {
        accountId: sourceAccount.id,
        counterparty: { name: 'Jane Doe' },
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Revenue',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: destinationAccount.id,
          counterparty: { name: 'Jane Doe' },
          amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
          exchangeRate: null,
          description: 'Cash',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-08-06T00:00:00.000Z'),
      postedAt: new Date('2026-08-06T00:00:00.000Z'),
      memo: 'Receipt',
    };

    await usecase(payload);

    expect(mockJournalEntryService.createReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceLine: expect.objectContaining({
          counterparty: null,
        }),
        destinationLines: expect.arrayContaining([
          expect.objectContaining({
            counterparty: null,
          }),
        ]),
      }),
      expect.any(Object)
    );
  });

  it('rejects on validation failure and prevents side-effects', async () => {
    const usecase = getUseCase();

    const payload = {
      sourceLine: {
        // Missing accountId
        counterparty: { name: 'Jane Doe' },
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Revenue',
        sequenceOrder: 1,
      },
      destinationLines: [], // Invalid, needs at least one line
      effectiveDate: new Date('2026-08-06T00:00:00.000Z'),
      postedAt: new Date('2026-08-06T00:00:00.000Z'),
      memo: 'Receipt',
    };

    await expect(usecase(payload as any)).rejects.toThrow();

    expect(mockAppContext.get).not.toHaveBeenCalled();
    expect(mockLedgerAccountRepo.findById).not.toHaveBeenCalled();
    expect(mockCounterpartyAppService.findOrCreateMany).not.toHaveBeenCalled();
  });
});
