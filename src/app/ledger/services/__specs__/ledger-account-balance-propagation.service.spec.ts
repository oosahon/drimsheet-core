import { SYSTEM_JURISDICTIONS } from '../../../../domain/accounting/config/jurisdictions.config';
import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import journalEntryError from '../../../../domain/journal-entry/errors/journal-entry.error';
import { EJournalEntrySourceType } from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import makeCashAccountService from '../../../../domain/ledger/services/asset-account/cash-account.service';
import makeEquityAccountService from '../../../../domain/ledger/services/equity-account/equity-account.service';
import {
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '../../../../domain/ledger/types/ledger.types';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
} from '../../../../domain/ledger/types/revenue-account.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import { EExchangeRateType } from '../../../../domain/money/types/exchange-rate.types';
import exchangeRateValue from '../../../../domain/money/values/exchange-rate.vo';
import moneyValue from '../../../../domain/money/values/money.vo';
import userEntity from '../../../../domain/user/entities/user.entity';
import mockReporter from '../../../../shared/contracts/__mocks__/reporter.mock';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import mockLedgerAccountBalanceAdjustmentQueue from '../../contracts/__mocks__/ledger-balance-adjustment-queue.mock';
import { mockLedgerAccountRepo } from '../../contracts/__mocks__/ledger.repos.mock';
import makeLedgerAccountBalancePropagationService from '../ledger-account-balance-propagation.service';

describe('ledgerAccountBalancePropagationService', () => {
  const service = makeLedgerAccountBalancePropagationService({
    ledgerAccountRepo: mockLedgerAccountRepo,
    ledgerBalanceAdjustmentQueue: mockLedgerAccountBalanceAdjustmentQueue,
    reporter: mockReporter,
  });
  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const equityAccountService = makeEquityAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });

  const mockOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  const jurisdictionCode: keyof typeof SYSTEM_JURISDICTIONS = 'NG';
  const timestamp = new Date('2026-06-15T10:30:00.000Z');

  async function makeFixture() {
    const [user] = userEntity.make({
      email: 'balance.propagation@example.com',
      emailVerified: true,
      firstName: 'Balance',
      lastName: 'Propagation',
    });

    const [accountingEntity] = accountingEntityEntity.make({
      name: 'Balance Propagation LLC',
      type: EAccountingEntityType.PrivateCompany,
      ownerId: user.id,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode,
    });

    const [controlAccount] = await cashAccountService.createHeader(
      {
        name: 'Cash and Cash Equivalents',
        accountingEntity,
        userId: user.id,
      },
      mockOptions
    );
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    const [postingAccount] = await cashAccountService.createPettyCashSubAccount(
      {
        name: 'Main Petty Cash',
        accountingEntity,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        userId: user.id,
        controlAccountCode: controlAccount.code,
      },
      mockOptions
    );

    const [equityAccount] =
      await equityAccountService.createRetainedEarningsAccount(
        {
          name: 'Retained Earnings',
          createdBy: user.id,
          accountingEntity,
        },
        mockOptions
      );

    return {
      accountingEntity,
      equityAccount,
      postingAccount,
      user,
    };
  }

  async function makeJournalEntry(isPosted: boolean) {
    const { accountingEntity, equityAccount, postingAccount, user } =
      await makeFixture();
    const debitAmount = moneyValue.make(100000n, SYSTEM_CURRENCIES.NGN, true);
    const creditAmount = moneyValue.make(40000n, SYSTEM_CURRENCIES.NGN, true);
    const offsetAmount = moneyValue.make(60000n, SYSTEM_CURRENCIES.NGN, true);

    const [journalEntry] = journalEntryEntity.make({
      accountingEntityId: accountingEntity.id,
      sourceType: EJournalEntrySourceType.Adjustment,
      effectiveDate: timestamp,
      postedAt: isPosted ? timestamp : null,
      memo: 'Balance propagation',
      createdBy: user.id,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: postingAccount.id,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          amount: debitAmount,
          exchangeRate: null,
          sequenceOrder: 1,
          side: EJournalSide.Debit,
          description: 'Cash increase',
        },
        {
          accountId: postingAccount.id,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          amount: creditAmount,
          exchangeRate: null,
          sequenceOrder: 2,
          side: EJournalSide.Credit,
          description: 'Cash decrease',
        },
        {
          accountId: equityAccount.id,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          amount: offsetAmount,
          exchangeRate: null,
          sequenceOrder: 3,
          side: EJournalSide.Credit,
          description: 'Equity offset',
        },
      ],
    });

    return {
      equityAccount,
      journalEntry,
      postingAccount,
    };
  }

  async function makeForeignCurrencyJournalEntry() {
    const { accountingEntity, equityAccount, postingAccount, user } =
      await makeFixture();
    const exchangeRate = exchangeRateValue.make({
      baseCurrencyCode: SYSTEM_CURRENCIES.USD.code,
      targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      rate: 2,
      type: EExchangeRateType.Official,
      asOf: new Date('2026-06-14T10:30:00.000Z'),
      source: 'CBN',
    });

    const [journalEntry] = journalEntryEntity.make({
      accountingEntityId: accountingEntity.id,
      sourceType: EJournalEntrySourceType.Adjustment,
      effectiveDate: timestamp,
      postedAt: timestamp,
      memo: 'Foreign currency propagation',
      createdBy: user.id,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: postingAccount.id,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          amount: moneyValue.make(50000n, SYSTEM_CURRENCIES.USD, true),
          exchangeRate,
          sequenceOrder: 1,
          side: EJournalSide.Debit,
          description: 'Foreign cash increase',
        },
        {
          accountId: equityAccount.id,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          amount: moneyValue.make(100000n, SYSTEM_CURRENCIES.NGN, true),
          exchangeRate: null,
          sequenceOrder: 2,
          side: EJournalSide.Credit,
          description: 'Equity offset',
        },
      ],
    });

    return {
      journalEntry,
      postingAccount,
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(timestamp);
    jest.clearAllMocks();
    mockLedgerAccountBalanceAdjustmentQueue.add.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('propagate', () => {
    it('should enqueue running balance adjustments for each posted journal line grouped by account', async () => {
      const { equityAccount, journalEntry, postingAccount } =
        await makeJournalEntry(true);

      mockLedgerAccountRepo.findById.mockImplementation(async (accountId) => {
        if (accountId === postingAccount.id) return postingAccount;
        if (accountId === equityAccount.id) return equityAccount;
        return null;
      });

      await service.propagate(journalEntry, mockOptions);

      expect(mockLedgerAccountRepo.findById).toHaveBeenNthCalledWith(
        1,
        postingAccount.id,
        journalEntry.accountingEntityId,
        mockOptions
      );
      expect(mockLedgerAccountRepo.findById).toHaveBeenNthCalledWith(
        2,
        equityAccount.id,
        journalEntry.accountingEntityId,
        mockOptions
      );
      expect(mockLedgerAccountBalanceAdjustmentQueue.add).toHaveBeenCalledTimes(
        2
      );
      expect(
        mockLedgerAccountBalanceAdjustmentQueue.add
      ).toHaveBeenNthCalledWith(1, {
        journalEntry: {
          id: journalEntry.id,
          createdBy: journalEntry.createdBy,
        },
        accountingEntityId: journalEntry.accountingEntityId,
        correlationId: mockOptions.correlationId,
        balanceDelta: {
          amount: 60000,
          currencyCode: SYSTEM_CURRENCIES.NGN.code,
          isMinorUnit: true,
        },
        functionalBalanceDelta: {
          amount: 60000,
          currencyCode: SYSTEM_CURRENCIES.NGN.code,
          isMinorUnit: true,
        },
        ledgerAccountId: postingAccount.id,
      });
      expect(
        mockLedgerAccountBalanceAdjustmentQueue.add
      ).toHaveBeenNthCalledWith(2, {
        journalEntry: {
          id: journalEntry.id,
          createdBy: journalEntry.createdBy,
        },
        accountingEntityId: journalEntry.accountingEntityId,
        correlationId: mockOptions.correlationId,
        balanceDelta: {
          amount: 60000,
          currencyCode: SYSTEM_CURRENCIES.NGN.code,
          isMinorUnit: true,
        },
        functionalBalanceDelta: {
          amount: 60000,
          currencyCode: SYSTEM_CURRENCIES.NGN.code,
          isMinorUnit: true,
        },
        ledgerAccountId: equityAccount.id,
      });
    });

    it('should skip draft journal entries', async () => {
      const { journalEntry } = await makeJournalEntry(false);

      await service.propagate(journalEntry, mockOptions);

      expect(mockLedgerAccountRepo.findById).not.toHaveBeenCalled();
      expect(
        mockLedgerAccountBalanceAdjustmentQueue.add
      ).not.toHaveBeenCalled();
    });

    it('should report and absorb a missing journal-line account', async () => {
      const { journalEntry, postingAccount } = await makeJournalEntry(true);

      mockLedgerAccountRepo.findById.mockResolvedValue(null);

      await expect(
        service.propagate(journalEntry, mockOptions)
      ).resolves.toBeUndefined();

      expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
        postingAccount.id,
        journalEntry.accountingEntityId,
        mockOptions
      );
      expect(
        mockLedgerAccountBalanceAdjustmentQueue.add
      ).not.toHaveBeenCalled();
      expect(mockReporter.report).toHaveBeenCalledWith(
        expect.any(journalEntryError.AccountNotFound),
        {
          correlationId: mockOptions.correlationId,
          accountingEntityId: journalEntry.accountingEntityId,
          journalEntryId: journalEntry.id,
        }
      );
    });

    it('should report and absorb mismatched journal-line currencies', async () => {
      const { journalEntry, postingAccount } =
        await makeForeignCurrencyJournalEntry();

      mockLedgerAccountRepo.findById.mockResolvedValue(postingAccount);

      await expect(
        service.propagate(journalEntry, mockOptions)
      ).resolves.toBeUndefined();

      expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
        postingAccount.id,
        journalEntry.accountingEntityId,
        mockOptions
      );
      expect(
        mockLedgerAccountBalanceAdjustmentQueue.add
      ).not.toHaveBeenCalled();
      expect(mockReporter.report).toHaveBeenCalledWith(
        expect.any(journalEntryError.MismatchedJournalLines),
        {
          correlationId: mockOptions.correlationId,
          accountingEntityId: journalEntry.accountingEntityId,
          journalEntryId: journalEntry.id,
        }
      );
    });

    it('uses functional amounts for mixed source currencies on a null-currency account', async () => {
      const { accountingEntity, equityAccount, postingAccount, user } =
        await makeFixture();
      const nullCurrencyAccount: ILedgerAccount = {
        ...equityAccount,
        type: ELedgerType.Revenue,
        normalBalance: ENormalBalance.Credit,
        subType: ERevenueSubType.Services,
        behavior: ERevenueAccountBehavior.Services,
        currency: null,
      };
      const usdRate = exchangeRateValue.make({
        baseCurrencyCode: SYSTEM_CURRENCIES.USD.code,
        targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        rate: 2,
        type: EExchangeRateType.Official,
        asOf: new Date('2026-06-14T10:30:00.000Z'),
        source: 'CBN',
      });
      const eurRate = exchangeRateValue.make({
        baseCurrencyCode: SYSTEM_CURRENCIES.EUR.code,
        targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        rate: 4,
        type: EExchangeRateType.Official,
        asOf: new Date('2026-06-14T10:30:00.000Z'),
        source: 'CBN',
      });
      const [journalEntry] = journalEntryEntity.make({
        accountingEntityId: accountingEntity.id,
        sourceType: EJournalEntrySourceType.Adjustment,
        effectiveDate: timestamp,
        postedAt: timestamp,
        memo: 'Mixed-currency null account',
        createdBy: user.id,
        functionalCurrency: SYSTEM_CURRENCIES.NGN,
        lines: [
          {
            accountId: nullCurrencyAccount.id,
            functionalCurrency: SYSTEM_CURRENCIES.NGN,
            amount: moneyValue.make(50000n, SYSTEM_CURRENCIES.USD, true),
            exchangeRate: usdRate,
            sequenceOrder: 1,
            side: EJournalSide.Credit,
            description: 'USD revenue',
          },
          {
            accountId: nullCurrencyAccount.id,
            functionalCurrency: SYSTEM_CURRENCIES.NGN,
            amount: moneyValue.make(25000n, SYSTEM_CURRENCIES.EUR, true),
            exchangeRate: eurRate,
            sequenceOrder: 2,
            side: EJournalSide.Credit,
            description: 'EUR revenue',
          },
          {
            accountId: postingAccount.id,
            functionalCurrency: SYSTEM_CURRENCIES.NGN,
            amount: moneyValue.make(200000n, SYSTEM_CURRENCIES.NGN, true),
            exchangeRate: null,
            sequenceOrder: 3,
            side: EJournalSide.Debit,
            description: 'Functional offset',
          },
        ],
      });
      mockLedgerAccountRepo.findById.mockImplementation(async (accountId) => {
        if (accountId === nullCurrencyAccount.id) return nullCurrencyAccount;
        if (accountId === postingAccount.id) return postingAccount;
        return null;
      });

      await service.propagate(journalEntry, mockOptions);

      expect(mockReporter.report).not.toHaveBeenCalled();
      expect(
        mockLedgerAccountBalanceAdjustmentQueue.add
      ).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          ledgerAccountId: nullCurrencyAccount.id,
          balanceDelta: {
            amount: 200000,
            currencyCode: SYSTEM_CURRENCIES.NGN.code,
            isMinorUnit: true,
          },
          functionalBalanceDelta: {
            amount: 200000,
            currencyCode: SYSTEM_CURRENCIES.NGN.code,
            isMinorUnit: true,
          },
        })
      );
    });

    it('should report and absorb queue delivery failures', async () => {
      const { equityAccount, journalEntry, postingAccount } =
        await makeJournalEntry(true);
      const failure = new Error('balance queue unavailable');

      mockLedgerAccountRepo.findById.mockImplementation(async (accountId) => {
        if (accountId === postingAccount.id) return postingAccount;
        if (accountId === equityAccount.id) return equityAccount;
        return null;
      });
      mockLedgerAccountBalanceAdjustmentQueue.add.mockRejectedValueOnce(
        failure
      );

      await expect(
        service.propagate(journalEntry, mockOptions)
      ).resolves.toBeUndefined();
      expect(mockReporter.report).toHaveBeenCalledWith(failure, {
        correlationId: mockOptions.correlationId,
        accountingEntityId: journalEntry.accountingEntityId,
        journalEntryId: journalEntry.id,
      });
    });

    it('should skip balance adjustment for OpeningBalance equity accounts', async () => {
      const { equityAccount, journalEntry, postingAccount } =
        await makeJournalEntry(true);

      const openingBalanceAccount = {
        ...equityAccount,
        subType: 'opening_balance',
      } as unknown as ILedgerAccount;

      mockLedgerAccountRepo.findById.mockImplementation(async (accountId) => {
        if (accountId === postingAccount.id) return postingAccount;
        if (accountId === equityAccount.id) return openingBalanceAccount;
        return null;
      });

      await service.propagate(journalEntry, mockOptions);

      expect(mockLedgerAccountBalanceAdjustmentQueue.add).toHaveBeenCalledTimes(
        1
      );
      expect(mockLedgerAccountBalanceAdjustmentQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({ ledgerAccountId: postingAccount.id })
      );
    });
  });
});
