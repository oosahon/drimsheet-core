import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import periodError from '../../../../domain/accounting/errors/period.error';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import { EJournalEntrySourceType } from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import { ASSET_LEDGER_CODES } from '../../../../domain/ledger/config/asset-codes.config';
import ledgerAccountError from '../../../../domain/ledger/errors/ledger-account.error';
import makeCashAccountService from '../../../../domain/ledger/services/asset-account/cash-account.service';
import { IBankDetails } from '../../../../domain/ledger/types/asset-account.types';
import bankDetailsValue from '../../../../domain/ledger/values/bank-details.vo';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import currencyEntity from '../../../../domain/money/entities/currency.entity';
import IEventBus from '../../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../../shared/contracts/repo.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import { mockAccountingPeriodService } from '../../../accounting/contracts/__mocks__/accounting.domain.services.mock';
import IAppContext from '../../../context/contracts/app-context.contract';
import mockJournalEntryPersistenceService from '../../../journal-entry/contracts/__mocks__/journal-entry-persistence.service.mock';
import mockJournalEntryService from '../../../journal-entry/contracts/__mocks__/journal-entry.service.mock';
import mockExchangeRateService from '../../../money/contracts/__mocks__/exchange-rate.service.mock';
import { mockFxCostBasisLotDomainService } from '../../../subledger/contracts/__mocks__/subledger.domain.services.mock';
import mockFxLotCostBasisService from '../../../subledger/fx-cost-basis/contracts/__mocks__/fx-cost-basis-persistence.service.mock';
import mockLedgerAccountBalancePropagationService from '../../contracts/__mocks__/ledger-account-balance-propagation.service.mock';
import { mockAssetAccountService } from '../../contracts/__mocks__/ledger.domain.services.mock';
import {
  mockBankAccountRepo,
  mockLedgerAccountRepo,
} from '../../contracts/__mocks__/ledger.repos.mock';
import ILedgerAccountPersistenceService from '../../contracts/ledger-account-persistence.service.contract';
import { IBankAccountCreationReq } from '../../dtos/asset-account/asset-account.dto';
import makeCreateBankAccountUseCase from '../create-bank-account.usecase';

describe('makeCreateBankAccountUseCase', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const [accountingEntity] = accountingEntityEntity.make({
    name: 'Test Accounting Entity',
    ownerId: userId,
    type: EAccountingEntityType.PrivateCompany,
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
  });
  const accountingEntityId = accountingEntity.id;
  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });

  const mockAppContext: jest.Mocked<IAppContext> = {
    get: jest.fn().mockReturnValue({
      correlationId: 'test-correlation-id',
      user: { id: userId },
      accountingEntity,
    }),
  } as unknown as jest.Mocked<IAppContext>;

  const mockEventBus: jest.Mocked<IEventBus> = {
    publish: jest.fn(),
  } as unknown as jest.Mocked<IEventBus>;

  const mockLedgerAccountPersistenceService: jest.Mocked<ILedgerAccountPersistenceService> =
    {
      create: jest.fn(),
    };

  const mockRepoService: jest.Mocked<IRepoService> = {
    runInTransaction: jest.fn().mockImplementation((fn) => fn({})),
  } as unknown as jest.Mocked<IRepoService>;

  const bankDetails: IBankDetails = bankDetailsValue.make({
    countryCode: 'NG',
    bankName: 'First Bank of Nigeria',
    accountName: 'Company Operating Account',
    accountNumber: '0123456789',
  });

  const validReq: IBankAccountCreationReq = {
    name: 'Operating Bank Account',
    currencyCode: 'NGN',
    controlAccountCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    bankAccount: {
      bankName: 'First Bank of Nigeria',
      accountName: 'Company Operating Account',
      accountNumber: '0123456789',
    },
    openingBalance: null,
  };

  type TCashAccountResult = Awaited<
    ReturnType<typeof cashAccountService.createBankSubAccount>
  >;
  let mockAccount: TCashAccountResult[0];
  let mockEvents: TCashAccountResult[1];
  let mockAudit: TCashAccountResult[2];
  let controlAccountId: TEntityId;

  type TJournalEntryResult = ReturnType<typeof journalEntryEntity.make>;
  let mockOpeningBalanceJournalEntry: TJournalEntryResult[0];
  let mockOpeningBalanceEvents: TJournalEntryResult[1];
  let mockOpeningBalanceAudit: TJournalEntryResult[2];

  beforeAll(async () => {
    const [controlAccount] = await cashAccountService.createHeader(
      {
        name: 'Cash and Cash Equivalents',
        accountingEntity,
        userId,
      },
      { correlationId: 'test-correlation-id' }
    );
    controlAccountId = controlAccount.id;
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    [mockAccount, mockEvents, mockAudit] =
      await cashAccountService.createBankSubAccount(
        {
          name: validReq.name,
          currency: currencyEntity.getByCode('NGN'),
          isControlAccount: false,
          userId,
          controlAccountCode: controlAccount.code,
          accountingEntity,
          bankDetails,
        },
        { correlationId: 'test-correlation-id' }
      );
    [
      mockOpeningBalanceJournalEntry,
      mockOpeningBalanceEvents,
      mockOpeningBalanceAudit,
    ] = journalEntryEntity.make({
      accountingEntityId,
      sourceType: EJournalEntrySourceType.OpeningBalance,
      effectiveDate: new Date('2026-03-01T00:00:00.000Z'),
      postedAt: new Date('2026-03-01T00:00:00.000Z'),
      memo: 'Opening balance',
      createdBy: userId,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: mockAccount.id,
          sequenceOrder: 1,
          amount: { amount: 10000n, currency: SYSTEM_CURRENCIES.NGN },
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Opening balance',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: controlAccountId,
          sequenceOrder: 2,
          amount: { amount: 10000n, currency: SYSTEM_CURRENCIES.NGN },
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: 'Opening balance',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    });
  });

  const deps = {
    appContext: mockAppContext,
    eventBus: mockEventBus,
    accountingPeriodService: mockAccountingPeriodService,
    cashAccountService: mockAssetAccountService,
    bankAccountRepo: mockBankAccountRepo,
    journalEntryService: mockJournalEntryService,
    journalEntryPersistenceService: mockJournalEntryPersistenceService,
    balancePropagationService: mockLedgerAccountBalancePropagationService,
    repoService: mockRepoService,
    ledgerAccountPersistenceService: mockLedgerAccountPersistenceService,
    fxCostBasisPersistenceService: mockFxLotCostBasisService.persistence,
    fxCostBasisService: mockFxCostBasisLotDomainService,
    exchangeRateService: mockExchangeRateService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBankAccountRepo.findOne.mockResolvedValue(null);
    mockAssetAccountService.createBankSubAccount.mockResolvedValue([
      mockAccount,
      [],
      mockAudit as any,
    ]);
    mockJournalEntryService.createOpeningBalance.mockResolvedValue([
      mockOpeningBalanceJournalEntry,
      mockOpeningBalanceEvents,
      mockOpeningBalanceAudit,
    ]);
  });

  it('creates a bank account without opening balance successfully', async () => {
    const useCase = makeCreateBankAccountUseCase(deps);
    const result = await useCase(validReq);

    expect(result.id).toBe(mockAccount.id);
    expect(result.name).toBe(validReq.name);
    expect(result.behavior).toBe('bank');
    expect(result.meta).toEqual(bankDetails);

    expect(mockBankAccountRepo.findOne).toHaveBeenCalledWith(
      bankDetails.bankName,
      bankDetails.accountNumber,
      expect.anything()
    );
    expect(mockAssetAccountService.createBankSubAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        controlAccountCode: validReq.controlAccountCode,
      }),
      expect.anything()
    );
    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalled();
    expect(mockBankAccountRepo.create).toHaveBeenCalledWith(
      mockAccount.id,
      accountingEntityId,
      bankDetails,
      expect.anything()
    );
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('creates a bank account with opening balance in functional currency', async () => {
    const reqWithOpeningBalance: IBankAccountCreationReq = {
      ...validReq,
      openingBalance: {
        amount: { amount: 10000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        date: new Date('2026-03-01T00:00:00.000Z'),
      },
    };

    const useCase = makeCreateBankAccountUseCase(deps);
    const result = await useCase(reqWithOpeningBalance);

    expect(result.id).toBe(mockAccount.id);
    expect(result.openingBalanceDate).toEqual(
      reqWithOpeningBalance.openingBalance?.date
    );
    expect(mockJournalEntryService.createOpeningBalance).toHaveBeenCalled();
    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalled();
    expect(mockBankAccountRepo.create).toHaveBeenCalled();
    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalled();
    expect(
      mockLedgerAccountBalancePropagationService.propagate
    ).toHaveBeenCalledWith(mockOpeningBalanceJournalEntry, expect.anything());
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('creates a bank account with opening balance in foreign currency and persists FX acquisition data', async () => {
    const foreignReq: IBankAccountCreationReq = {
      name: 'USD Bank Account',
      currencyCode: 'USD',
      controlAccountCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      bankAccount: {
        bankName: 'Bank of America',
        accountName: 'US Operating Account',
        accountNumber: '9876543210',
      },
      openingBalance: {
        amount: { amount: 5000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: {
          baseCurrencyCode: 'USD',
          targetCurrencyCode: 'NGN',
          rate: 1500,
          type: 'market' as any,
          source: 'manual',
          asOf: new Date('2026-03-01T00:00:00.000Z'),
        },
        date: new Date('2026-03-01T00:00:00.000Z'),
      },
    };

    const [controlAccount] = await cashAccountService.createHeader(
      {
        name: 'Cash and Cash Equivalents',
        accountingEntity,
        userId,
      },
      { correlationId: 'test-correlation-id' }
    );
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    const [foreignMockAccount] = await cashAccountService.createBankSubAccount(
      {
        name: foreignReq.name,
        currency: currencyEntity.getByCode('USD'),
        isControlAccount: false,
        userId,
        controlAccountCode: controlAccount.code,
        accountingEntity,
        bankDetails: bankDetailsValue.make({
          countryCode: 'NG',
          bankName: foreignReq.bankAccount.bankName,
          accountName: foreignReq.bankAccount.accountName,
          accountNumber: foreignReq.bankAccount.accountNumber,
        }),
      },
      { correlationId: 'test-correlation-id' }
    );

    mockAssetAccountService.createBankSubAccount.mockResolvedValueOnce([
      foreignMockAccount,
      [],
      mockAudit as any,
    ]);

    const mockForeignJournalEntry = {
      ...mockOpeningBalanceJournalEntry,
      lines: [
        {
          accountId: foreignMockAccount.id,
          sequenceOrder: 1,
          amount: { amount: 5000n, currency: SYSTEM_CURRENCIES.USD },
          functionalAmount: {
            amount: 7500000n,
            currency: SYSTEM_CURRENCIES.NGN,
          },
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Opening balance',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    };
    mockJournalEntryService.createOpeningBalance.mockResolvedValueOnce([
      mockForeignJournalEntry as any,
      mockOpeningBalanceEvents,
      mockOpeningBalanceAudit,
    ]);

    const lotId = '123e4567-e89b-12d3-a456-426614174099' as TEntityId;
    const acqId = '123e4567-e89b-12d3-a456-426614174098' as TEntityId;
    const mockLotData = {
      lot: [
        { id: lotId },
        [
          {
            type: 'fx_cost_basis_lot_created',
            data: {},
            occurredAt: new Date(),
          },
        ],
        {
          entityId: lotId,
          action: 'create',
          diff: { before: null, after: { id: lotId } },
          occurredAt: new Date(),
        },
      ],
      acquisition: [
        { id: acqId },
        [
          {
            type: 'fx_cost_basis_lot_acquisition_created',
            data: {},
            occurredAt: new Date(),
          },
        ],
        {
          entityId: acqId,
          action: 'create',
          diff: { before: null, after: { id: acqId } },
          occurredAt: new Date(),
        },
      ],
    };
    mockFxCostBasisLotDomainService.acquire.mockReturnValueOnce(
      mockLotData as any
    );
    mockExchangeRateService.getOfficialRate.mockResolvedValueOnce({
      rate: 1500,
      currencyPair: { baseCurrencyCode: 'USD', quoteCurrencyCode: 'NGN' },
      asOf: new Date('2026-03-01T00:00:00.000Z'),
    } as any);

    const useCase = makeCreateBankAccountUseCase(deps);
    const result = await useCase(foreignReq);

    expect(result.id).toBe(foreignMockAccount.id);
    expect(
      mockFxLotCostBasisService.persistence.persistAcquisition
    ).toHaveBeenCalledWith(
      mockLotData.lot[0],
      mockLotData.acquisition[0],
      expect.objectContaining({ entityId: lotId }),
      expect.objectContaining({ entityId: acqId }),
      expect.anything()
    );
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('rejects duplicate bank account across entities', async () => {
    mockBankAccountRepo.findOne.mockResolvedValueOnce(bankDetails);

    const useCase = makeCreateBankAccountUseCase(deps);
    await expect(useCase(validReq)).rejects.toBeInstanceOf(
      ledgerAccountError.DuplicateBankAccount
    );
  });

  it('rejects when opening balance date is not covered by open accounting period', async () => {
    mockAccountingPeriodService.validatePostingPeriod.mockRejectedValueOnce(
      new periodError.PostingPeriodNotOpen({
        accountingEntityId,
        postingDate: new Date('2026-03-01T00:00:00.000Z'),
      })
    );

    const reqWithOpeningBalance: IBankAccountCreationReq = {
      ...validReq,
      openingBalance: {
        amount: { amount: 10000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        date: new Date('2026-03-01T00:00:00.000Z'),
      },
    };

    const useCase = makeCreateBankAccountUseCase(deps);
    await expect(useCase(reqWithOpeningBalance)).rejects.toBeInstanceOf(
      periodError.PostingPeriodNotOpen
    );
  });

  it('does not propagate balance or publish events when transaction fails during opening balance creation', async () => {
    const failure = new Error('transaction failure');
    mockRepoService.runInTransaction.mockRejectedValueOnce(failure);

    const reqWithOpeningBalance: IBankAccountCreationReq = {
      ...validReq,
      openingBalance: {
        amount: { amount: 10000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        date: new Date('2026-03-01T00:00:00.000Z'),
      },
    };

    const useCase = makeCreateBankAccountUseCase(deps);
    await expect(useCase(reqWithOpeningBalance)).rejects.toBe(failure);

    expect(
      mockLedgerAccountBalancePropagationService.propagate
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
