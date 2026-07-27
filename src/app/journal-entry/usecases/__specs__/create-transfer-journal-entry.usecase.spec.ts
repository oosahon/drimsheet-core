import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import {
  EExchangeRateType,
  IExchangeRate,
} from '../../../../domain/money/types/exchange-rate.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.mock';
import mockJournalEntryPersistenceService from '../../../bookkeeping/contracts/__mocks__/journal-entry-persistence.service.mock';
import mockLedgerAccountBalancePropagationService from '../../../bookkeeping/contracts/__mocks__/ledger-account-balance-adjustment-service.mock';
import mockTransactionEntryService from '../../../bookkeeping/contracts/__mocks__/transaction-entry.service.mock';

import { TEntityId } from '../../../../shared/types/uuid';
import mockAppContext, {
  mockClientSession,
} from '../../../_internal/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '../../../_internal/contracts/app-context.contract';
import makeCreateTransferJournalEntryUseCase from '../create-transfer-journal-entry.usecase';

describe('createTransferJournalEntryUseCase', () => {
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

  const accountId1 = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
  const accountId2 = '123e4567-e89b-12d3-a456-426614174003' as TEntityId;

  const mockJournalEntryResult = journalEntryEntity.make({
    accountingEntityId: mockAccountingEntity.id,
    sourceType: EJournalEntrySourceType.Transfer,
    counterPartyId: null,
    status: EJournalEntryStatus.Posted,
    effectiveDate: new Date(),
    postedAt: new Date(),
    voidedAt: null,
    voidingEntryId: null,
    memo: 'Transfer memo',
    createdBy: mockUser.id,
    functionalCurrency: SYSTEM_CURRENCIES.NGN,
    lines: [
      {
        accountId: accountId1,
        sequenceOrder: 1,
        amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
        exchangeRate: null,
        side: EJournalSide.Debit,
        description: 'Source Line',
        functionalCurrency: SYSTEM_CURRENCIES.NGN,
      },
      {
        accountId: accountId2,
        sequenceOrder: 2,
        amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
        exchangeRate: null,
        side: EJournalSide.Credit,
        description: 'Destination Line',
        functionalCurrency: SYSTEM_CURRENCIES.NGN,
      },
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLedgerAccountBalancePropagationService.propagate
      .mockReset()
      .mockResolvedValue();

    mockAppContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IAppContextData);

    mockTransactionEntryService.create.mockResolvedValue(
      mockJournalEntryResult
    );

    mockJournalEntryPersistenceService.create.mockResolvedValue(undefined);
  });

  const getUseCase = () =>
    makeCreateTransferJournalEntryUseCase({
      appContext: mockAppContext,
      transactionEntryService: mockTransactionEntryService,
      journalEntryPersistenceService: mockJournalEntryPersistenceService,
      balancePropagationService: mockLedgerAccountBalancePropagationService,
      eventBus: mockEventBus,
    });

  const validPayload = {
    sourceLine: {
      accountId: accountId1,
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
      description: 'Source Line',
      sequenceOrder: 1,
    },
    destinationLines: [
      {
        accountId: accountId2,
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Destination Line',
        sequenceOrder: 2,
      },
    ],
    status: EJournalEntryStatus.Posted,
    effectiveDate: new Date(),
    postedAt: new Date(),
    memo: 'Transfer memo',
  };

  it('should successfully record transfer journal entry', async () => {
    const useCase = getUseCase();

    await useCase(validPayload);

    expect(mockTransactionEntryService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: accountId1,
        sequenceOrder: 1,
      }),
      expect.arrayContaining([
        expect.objectContaining({
          accountId: accountId2,
          sequenceOrder: 2,
        }),
      ]),
      expect.objectContaining({
        accountingEntityId: mockAccountingEntity.id,
        sourceType: EJournalEntrySourceType.Transfer,
      }),
      { correlationId }
    );
    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalledWith(
      mockJournalEntryResult[0],
      expect.any(Object),
      expect.any(Array),
      { correlationId }
    );
    expect(
      mockLedgerAccountBalancePropagationService.propagate
    ).toHaveBeenCalledWith(mockJournalEntryResult[0], { correlationId });
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('should handle exchange rates correctly when provided', async () => {
    const useCase = getUseCase();

    const mockExchangeRate: IExchangeRate = {
      currencyPair: 'USD/NGN',
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1500,
      type: EExchangeRateType.Official,
      asOf: new Date(),
      source: 'test',
      createdAt: new Date(),
    };

    const payload = {
      ...validPayload,
      sourceLine: {
        ...validPayload.sourceLine,
        amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: {
          baseCurrencyCode: 'USD',
          targetCurrencyCode: 'NGN',
          rate: 1500,
          type: EExchangeRateType.Official,
          asOf: new Date('2026-03-14T00:00:00.000Z'),
          source: 'test',
        },
      },
      destinationLines: [
        {
          ...validPayload.destinationLines[0],
          amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
          exchangeRate: {
            baseCurrencyCode: 'USD',
            targetCurrencyCode: 'NGN',
            rate: 1500,
            type: EExchangeRateType.Official,
            asOf: new Date('2026-03-14T00:00:00.000Z'),
            source: 'test',
          },
        },
      ],
    };

    await useCase(payload);
  });

  it('should throw validation error if payload is invalid', async () => {
    const useCase = getUseCase();

    const invalidPayload = {
      ...validPayload,
      destinationLines: [], // Requires at least one destination line
    };

    await expect(useCase(invalidPayload as any)).rejects.toThrow();
  });
});
