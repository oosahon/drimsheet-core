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
import { EAssetAccountBehavior } from '../../../../domain/ledger/types/asset-account.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockRequestContext, {
  mockClientSession,
} from '../../../../infra/services/__mocks__/request-context.mock';
import mockCurrencyDomainServices from '../../../../infra/services/domain/__mocks__/currency.domain.service.mock';
import mockJournalEntryDomainServices from '../../../../infra/services/domain/__mocks__/journal-entry.domain.service.mock';
import { IRequestContextData } from '../../../../shared/contracts/request-context.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import { ITransferTransactionReq } from '../../dtos/transfer-transaction.dto';
import makeRecordTransferJournalEntryUseCase from '../record-transfer-journal-entry.usecase';

describe('recordTransferJournalEntryUseCase', () => {
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
    functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
    jurisdictionCode: 'NG',
  });

  const [sourceAccount] = cashAndEquivalentAccountEntity.make(
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

  const [destinationAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Bank',
      accountingEntityId: mockAccountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy: mockUser.id,
    },
    { precedingCode: '100100', parentMaterializedPath: '100000' }
  );

  const effectiveDate = new Date('2026-04-24T00:00:00.000Z');
  const postedAt = new Date('2026-04-24T01:00:00.000Z');

  const exchangeRateDto = {
    id: 1,
    baseCurrencyCode: SYSTEM_CURRENCIES.USD.code,
    targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
    rate: 1500,
    type: EExchangeRateType.Official,
    asOf: '2026-04-24T00:00:00.000Z' as unknown as Date,
    source: 'test',
  };

  const mockExchangeRate: IExchangeRate = {
    currencyPair: `${SYSTEM_CURRENCIES.USD.code}/${SYSTEM_CURRENCIES.NGN.code}`,
    baseCurrencyCode: SYSTEM_CURRENCIES.USD.code,
    targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
    rate: 1500,
    type: EExchangeRateType.Official,
    asOf: new Date('2026-04-24T00:00:00.000Z'),
    source: 'test',
    createdAt: new Date('2026-04-24T00:00:00.000Z'),
  };

  const validPayload: ITransferTransactionReq = {
    sourceLine: {
      accountId: sourceAccount.id,
      amount: {
        amount: 1500,
        currencyCode: SYSTEM_CURRENCIES.USD.code,
        isMinorUnit: true,
      },
      exchangeRate: exchangeRateDto,
      description: 'Transfer from cash',
      side: EJournalSide.Credit,
      sequenceOrder: 1,
    },
    destinationLines: [
      {
        accountId: destinationAccount.id,
        amount: {
          amount: 2250000,
          currencyCode: SYSTEM_CURRENCIES.NGN.code,
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: 'Transfer to bank',
        side: EJournalSide.Debit,
        sequenceOrder: 2,
      },
    ],
    status: EJournalEntryStatus.Posted,
    effectiveDate,
    postedAt,
    memo: 'Move cash to bank',
  };

  const makeSavedJournalEntry = () =>
    journalEntryEntity.make({
      accountingEntityId: mockAccountingEntity.id,
      sourceType: EJournalEntrySourceType.Transfer,
      counterPartyId: null,
      status: EJournalEntryStatus.Posted,
      effectiveDate,
      postedAt,
      voidedAt: null,
      voidingEntryId: null,
      memo: validPayload.memo,
      createdBy: mockUser.id,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: sourceAccount.id,
          amount: {
            amount: 2250000n,
            currency: SYSTEM_CURRENCIES.NGN,
          },
          exchangeRate: null,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          description: validPayload.sourceLine.description,
          side: EJournalSide.Credit,
          sequenceOrder: 1,
        },
        {
          accountId: destinationAccount.id,
          amount: {
            amount: 2250000n,
            currency: SYSTEM_CURRENCIES.NGN,
          },
          exchangeRate: null,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          description: validPayload.destinationLines[0].description,
          side: EJournalSide.Debit,
          sequenceOrder: 2,
        },
      ],
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequestContext.get.mockReturnValue({
      correlationId,
      idempotencyKey: 'test-idempotency-key',
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as IRequestContextData);

    const journalEntryResult = makeSavedJournalEntry();

    mockCurrencyDomainServices.exchangeRate.getExchangeRate
      .mockResolvedValueOnce(mockExchangeRate)
      .mockResolvedValueOnce(null);
    mockJournalEntryDomainServices.journalEntry.recordTransaction.mockResolvedValue(
      journalEntryResult
    );
  });

  const getUseCase = () =>
    makeRecordTransferJournalEntryUseCase(
      mockRequestContext,
      mockJournalEntryDomainServices.journalEntry,
      mockJournalEntryDomainServices.journalEntryPersistence,
      mockCurrencyDomainServices.exchangeRate,
      mockEventBus
    );

  it('records a transfer journal entry and publishes enriched domain events', async () => {
    const useCase = getUseCase();
    const [journalEntry, events, audit] = makeSavedJournalEntry();

    mockJournalEntryDomainServices.journalEntry.recordTransaction.mockResolvedValueOnce(
      [journalEntry, events, audit]
    );

    await useCase(validPayload);

    expect(
      mockCurrencyDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenCalledWith(validPayload.sourceLine.exchangeRate, {
      correlationId,
    });
    expect(
      mockCurrencyDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenCalledWith(validPayload.destinationLines[0].exchangeRate, {
      correlationId,
    });

    expect(
      mockJournalEntryDomainServices.journalEntry.recordTransaction
    ).toHaveBeenCalledWith(
      {
        sourceLine: expect.objectContaining({
          accountId: sourceAccount.id,
          sequenceOrder: validPayload.sourceLine.sequenceOrder,
          amount: {
            amount: 1500n,
            currency: SYSTEM_CURRENCIES.USD,
          },
          exchangeRate: mockExchangeRate,
          side: EJournalSide.Credit,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          description: validPayload.sourceLine.description,
        }),
        destinationLines: [
          expect.objectContaining({
            accountId: destinationAccount.id,
            sequenceOrder: validPayload.destinationLines[0].sequenceOrder,
            amount: {
              amount: 2250000n,
              currency: SYSTEM_CURRENCIES.NGN,
            },
            exchangeRate: null,
            side: EJournalSide.Debit,
            functionalCurrency: SYSTEM_CURRENCIES.NGN,
            description: validPayload.destinationLines[0].description,
          }),
        ],
        header: {
          accountingEntityId: mockAccountingEntity.id,
          sourceType: EJournalEntrySourceType.Transfer,
          counterPartyId: null,
          status: validPayload.status,
          effectiveDate,
          postedAt,
          voidedAt: null,
          voidingEntryId: null,
          memo: validPayload.memo,
          createdBy: mockUser.id,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      },
      { correlationId }
    );
    expect(
      mockJournalEntryDomainServices.journalEntryPersistence.create
    ).toHaveBeenCalledWith(
      journalEntry,
      expect.objectContaining({
        entityId: journalEntry.id,
        correlationId,
      }),
      expect.arrayContaining([
        expect.objectContaining({
          entityId: journalEntry.lines[0].id,
          correlationId,
        }),
        expect.objectContaining({
          entityId: journalEntry.lines[1].id,
          correlationId,
        }),
      ]),
      { correlationId }
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      events.map((event) =>
        expect.objectContaining({
          type: event.type,
          data: event.data,
          correlationId,
          enrichedAt: expect.any(Date),
        })
      )
    );
  });

  it('does not call dependencies when transfer payload validation fails', async () => {
    const useCase = getUseCase();
    const invalidPayload: ITransferTransactionReq = {
      ...validPayload,
      destinationLines: [],
    };

    await expect(useCase(invalidPayload)).rejects.toThrow(
      'app_error_unprocessable'
    );

    expect(
      mockCurrencyDomainServices.exchangeRate.getExchangeRate
    ).not.toHaveBeenCalled();
    expect(
      mockJournalEntryDomainServices.journalEntry.recordTransaction
    ).not.toHaveBeenCalled();
    expect(
      mockJournalEntryDomainServices.journalEntryPersistence.create
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
