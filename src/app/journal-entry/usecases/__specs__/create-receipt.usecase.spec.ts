import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import makeCounterpartyService from '../../../../domain/counterparty/services/counterparty.service';
import { ECounterpartyType } from '../../../../domain/counterparty/types/counterparty.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import { IJournalEntryService } from '../../../../domain/journal-entry/types/journal-entry.service.types';
import { EJournalEntrySourceType } from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/asset-account/types/asset-account.types';
import servicesAccountEntity from '../../../../domain/ledger/revenue-account/entities/services.entity';
import ILedgerAccountRepo from '../../../../domain/ledger/shared/repos/ledger-account.repo';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '../../../../shared/types/repo.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import mockAppContext, {
  mockClientSession,
} from '../../../context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '../../../context/contracts/app-context.contract';
import mockCounterpartyPersistenceService from '../../../counterparty/contracts/__mocks__/persistence.service.mock';
import ICounterpartyAppService, {
  ICounterpartyFindOrCreateRes,
} from '../../../counterparty/contracts/counterparty.service.contract';
import mockLedgerAccountBalancePropagationService from '../../../ledger/contracts/__mocks__/ledger-account-balance-propagation.service.mock';
import mockJournalEntryPersistenceService from '../../contracts/__mocks__/journal-entry-persistence.service.mock';
import makeCreateReceiptUsecase from '../create-receipt.usecase';

const mockCounterpartyAppService: jest.Mocked<ICounterpartyAppService> = {
  findOrCreate: jest.fn(),
  findOrCreateMany: jest.fn(),
  getFoundOrCreated: jest.fn(),
};

const mockJournalEntryService: jest.Mocked<IJournalEntryService> = {
  createReceipt: jest.fn(),
};

const mockLedgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByIds: jest.fn(),
  findByCode: jest.fn(),
  findBySubType: jest.fn(),
  findByBehavior: jest.fn(),
  findLatestBySubType: jest.fn(),
  findAll: jest.fn(),
};

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
  const counterpartyResponse: ICounterpartyFindOrCreateRes = {
    new: true,
    data: newCounterparty,
  };

  const journalEntry = journalEntryEntity.make({
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

    mockLedgerAccountRepo.findById
      .mockResolvedValueOnce(sourceAccount)
      .mockResolvedValueOnce(destinationAccount);

    const counterparties = new Map([['counterparty', counterpartyResponse]]);
    mockCounterpartyAppService.findOrCreateMany.mockResolvedValue(
      counterparties
    );
    mockCounterpartyAppService.getFoundOrCreated.mockReturnValue(
      counterpartyResponse
    );
    mockJournalEntryService.createReceipt.mockResolvedValue(journalEntry);
    mockRepoService.runInTransaction.mockImplementation(async (transactionFn) =>
      transactionFn('mock-tx' as unknown as ITransactionContext)
    );
    mockLedgerAccountBalancePropagationService.propagate.mockResolvedValue();
    mockEventBus.publish.mockResolvedValue();
  });

  it('publishes new counterparty events before dependent journal events', async () => {
    const usecase = makeCreateReceiptUsecase({
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

    await usecase({
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
    });

    const [publishedEvents] = mockEventBus.publish.mock.calls[0];

    expect(publishedEvents).toEqual([
      expect.objectContaining({ type: 'domain:counterparty:created' }),
      expect.objectContaining({ type: 'domain:journal-entry:created' }),
      expect.objectContaining({ type: 'domain:journal-line-item:created' }),
      expect.objectContaining({ type: 'domain:journal-line-item:created' }),
    ]);
  });
});
