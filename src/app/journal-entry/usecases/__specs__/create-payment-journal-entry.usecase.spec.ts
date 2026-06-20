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
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockBookkeepingServices from '../../../../infra/services/__mocks__/bookkeeping.service.mock';
import mockRequestContext, {
  mockClientSession,
} from '../../../../infra/services/__mocks__/request-context.mock';
import mockCurrencyDomainServices from '../../../../infra/services/domain/__mocks__/currency.domain.service.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import { IRequestContextData } from '../../../shared/contracts/request-context.contract';
import makeCreatePaymentJournalEntryUseCase from '../create-payment-journal-entry.usecase';

describe('createPaymentJournalEntryUseCase', () => {
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
    sourceType: EJournalEntrySourceType.Payment,
    counterPartyId: null,
    status: EJournalEntryStatus.Posted,
    effectiveDate: new Date(),
    postedAt: new Date(),
    voidedAt: null,
    voidingEntryId: null,
    memo: 'Payment memo',
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

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    mockBookkeepingServices.transactionEntry.create.mockResolvedValue(
      mockJournalEntryResult
    );

    mockBookkeepingServices.journalEntryPersistence.create.mockResolvedValue(
      undefined
    );

    mockCurrencyDomainServices.exchangeRate.getExchangeRate.mockResolvedValue(
      null
    );
  });

  const getUseCase = () =>
    makeCreatePaymentJournalEntryUseCase(
      mockRequestContext,
      mockBookkeepingServices.transactionEntry,
      mockBookkeepingServices.journalEntryPersistence,
      mockCurrencyDomainServices.exchangeRate,
      mockEventBus
    );

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
    memo: 'Payment memo',
  };

  it('should successfully record payment journal entry', async () => {
    const useCase = getUseCase();

    await useCase(validPayload);

    expect(
      mockCurrencyDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenCalledWith(null, { correlationId });
    expect(
      mockBookkeepingServices.transactionEntry.create
    ).toHaveBeenCalledWith(
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
        sourceType: EJournalEntrySourceType.Payment,
      }),
      { correlationId }
    );
    expect(
      mockBookkeepingServices.journalEntryPersistence.create
    ).toHaveBeenCalledWith(
      mockJournalEntryResult[0],
      expect.any(Object),
      expect.any(Array),
      { correlationId }
    );
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

    mockCurrencyDomainServices.exchangeRate.getExchangeRate.mockResolvedValue(
      mockExchangeRate
    );

    const payload = {
      ...validPayload,
      sourceLine: {
        ...validPayload.sourceLine,
        amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: {
          id: 1,
          baseCurrencyCode: 'USD',
          targetCurrencyCode: 'NGN',
          rate: 1500,
          type: EExchangeRateType.Official,
          asOf: new Date().toISOString() as unknown as Date,
          source: 'test',
        },
      },
    };

    await useCase(payload);

    expect(
      mockCurrencyDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenCalledWith(payload.sourceLine.exchangeRate, { correlationId });
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
