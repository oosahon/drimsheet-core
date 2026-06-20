import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
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
import { IJournalEntryReq } from '../../dtos/transaction.dto';
import makeCreateJournalEntryUseCase from '../create-journal-entry.usecase';

describe('createJournalEntryUseCase', () => {
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

  const validPayload: IJournalEntryReq = {
    sourceType: EJournalEntrySourceType.Adjustment,
    status: EJournalEntryStatus.Draft,
    effectiveDate: new Date('2026-06-19T00:00:00.000Z'),
    postedAt: null,
    memo: 'Test memo',
    sourceLine: {
      accountId: '123e4567-e89b-12d3-a456-426614174003',
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
      description: 'Source line description',
      sequenceOrder: 1,
    },
    destinationLines: [
      {
        accountId: '123e4567-e89b-12d3-a456-426614174004',
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Destination line description',
        sequenceOrder: 2,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    mockCurrencyDomainServices.exchangeRate.getExchangeRate.mockResolvedValue(
      null
    );

    mockBookkeepingServices.transactionEntry.create.mockImplementation(
      async (source, destinations, header) => {
        return journalEntryEntity.make({
          ...header,
          lines: [
            { ...source, side: EJournalSide.Credit },
            ...destinations.map((d: any) => ({
              ...d,
              side: EJournalSide.Debit,
            })),
          ],
        });
      }
    );
  });

  const getUseCase = () =>
    makeCreateJournalEntryUseCase(
      mockRequestContext,
      mockBookkeepingServices.transactionEntry,
      mockBookkeepingServices.journalEntryPersistence,
      mockCurrencyDomainServices.exchangeRate,
      mockEventBus
    );

  it('should successfully create a journal entry', async () => {
    const useCase = getUseCase();

    await useCase(validPayload);

    expect(
      mockBookkeepingServices.transactionEntry.create
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: validPayload.sourceLine.accountId,
      }),
      expect.arrayContaining([
        expect.objectContaining({
          accountId: validPayload.destinationLines[0].accountId,
        }),
      ]),
      expect.objectContaining({
        accountingEntityId: mockAccountingEntity.id,
        sourceType: validPayload.sourceType,
        status: validPayload.status,
      }),
      { correlationId }
    );

    expect(
      mockBookkeepingServices.journalEntryPersistence.create
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        accountingEntityId: mockAccountingEntity.id,
      }),
      expect.objectContaining({
        action: 'created',
        correlationId,
      }),
      expect.arrayContaining([
        expect.objectContaining({
          action: 'created',
          correlationId,
        }),
      ]),
      { correlationId }
    );

    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('should retrieve exchange rates when exchangeRate field is provided', async () => {
    const mockExchangeRate: IExchangeRate = {
      currencyPair: 'USD/NGN',
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1500,
      type: EExchangeRateType.Official,
      asOf: new Date('2026-06-19T00:00:00.000Z'),
      source: 'test',
      createdAt: new Date(),
    };

    mockCurrencyDomainServices.exchangeRate.getExchangeRate.mockImplementation(
      async (req) => (req ? mockExchangeRate : null)
    );

    const payloadWithRates: IJournalEntryReq = {
      ...validPayload,
      sourceLine: {
        ...validPayload.sourceLine,
        amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: {
          baseCurrencyCode: 'USD',
          targetCurrencyCode: 'NGN',
          rate: 1500,
          type: EExchangeRateType.Official,
          asOf: '2026-06-19T00:00:00.000Z' as unknown as Date,
          source: 'test',
        },
      },
      destinationLines: [
        {
          ...validPayload.destinationLines[0],
          amount: { amount: 1500000, currencyCode: 'NGN', isMinorUnit: true },
          exchangeRate: null,
        },
      ],
    };

    const useCase = getUseCase();
    await useCase(payloadWithRates);

    expect(
      mockCurrencyDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenCalledTimes(2);

    expect(
      mockCurrencyDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenNthCalledWith(1, payloadWithRates.sourceLine.exchangeRate, {
      correlationId,
    });

    expect(
      mockCurrencyDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenNthCalledWith(
      2,
      payloadWithRates.destinationLines[0].exchangeRate,
      { correlationId }
    );
  });

  it('should throw validation error if the payload is invalid', async () => {
    const useCase = getUseCase();

    // Invalid accountId (not uuid)
    const invalidPayload = {
      ...validPayload,
      sourceLine: {
        ...validPayload.sourceLine,
        accountId: 'invalid-uuid',
      },
    };

    await expect(useCase(invalidPayload)).rejects.toThrow();
  });
});
