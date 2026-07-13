import { SYSTEM_JURISDICTIONS } from '../../../../domain/accounting/config/jurisdictions.config';
import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import journalEntryError from '../../../../domain/journal-entry/errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  UJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import openingBalanceEquityLedgerEntity from '../../../../domain/ledger/equity-account/entities/opening-balance-equity.entity';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import { EExchangeRateType } from '../../../../domain/money/types/exchange-rate.types';
import exchangeRateValue from '../../../../domain/money/value-objects/exchange-rate.vo';
import moneyValue from '../../../../domain/money/value-objects/money.vo';
import userEntity from '../../../../domain/user/entities/user.entity';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import mockLedgerAccountBalanceAdjustmentQueue from '../../../ledger/contracts/__mocks__/ledger-balance-adjustment-queue.contract.mock';
import makeLedgerAccountBalancePropagationService from '../ledger-account-balance-propagation.service';

describe('ledgerAccountBalancePropagationService', () => {
  const service = makeLedgerAccountBalancePropagationService({
    ledgerAccountRepo: mockLedgerAccountRepo,
    ledgerBalanceAdjustmentQueue: mockLedgerAccountBalanceAdjustmentQueue,
  });

  const mockOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  const jurisdictionCode: keyof typeof SYSTEM_JURISDICTIONS = 'NG';
  const timestamp = new Date('2026-06-15T10:30:00.000Z');

  function makeFixture() {
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

    const [controlAccount] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Cash and Cash Equivalents',
      accountingEntityId: accountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      createdBy: user.id,
    });

    const [postingAccount] =
      cashAndEquivalentAccountEntity.makePettyCashAccount(
        {
          name: 'Main Petty Cash',
          accountingEntityId: accountingEntity.id,
          currency: SYSTEM_CURRENCIES.NGN,
          isControlAccount: false,
          controlAccountId: controlAccount.id,
          createdBy: user.id,
        },
        {
          parentMaterializedPath: controlAccount.code,
          precedingCode: controlAccount.code,
        }
      );

    const [equityAccount] = openingBalanceEquityLedgerEntity.make(
      {
        name: 'Opening Balance Equity',
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.NGN,
        createdBy: user.id,
      },
      null
    );

    return {
      accountingEntity,
      equityAccount,
      postingAccount,
      user,
    };
  }

  function makeJournalEntry(status: UJournalEntryStatus) {
    const { accountingEntity, equityAccount, postingAccount, user } =
      makeFixture();
    const debitAmount = moneyValue.make(100000n, SYSTEM_CURRENCIES.NGN, true);
    const creditAmount = moneyValue.make(40000n, SYSTEM_CURRENCIES.NGN, true);
    const offsetAmount = moneyValue.make(60000n, SYSTEM_CURRENCIES.NGN, true);

    const [journalEntry] = journalEntryEntity.make({
      accountingEntityId: accountingEntity.id,
      sourceType: EJournalEntrySourceType.Adjustment,
      counterPartyId: null,
      status,
      effectiveDate: timestamp,
      postedAt: status === EJournalEntryStatus.Posted ? timestamp : null,
      voidedAt: null,
      voidingEntryId: null,
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

  function makeForeignCurrencyJournalEntry() {
    const { accountingEntity, equityAccount, postingAccount, user } =
      makeFixture();
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
      counterPartyId: null,
      status: EJournalEntryStatus.Posted,
      effectiveDate: timestamp,
      postedAt: timestamp,
      voidedAt: null,
      voidingEntryId: null,
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
      const { equityAccount, journalEntry, postingAccount } = makeJournalEntry(
        EJournalEntryStatus.Posted
      );

      mockLedgerAccountRepo.findById.mockImplementation(async (accountId) => {
        if (accountId === postingAccount.id) return postingAccount;
        if (accountId === equityAccount.id) return equityAccount;
        return null;
      });

      await service.propagate(journalEntry, mockOptions);

      expect(mockLedgerAccountRepo.findById).toHaveBeenNthCalledWith(
        1,
        postingAccount.id,
        mockOptions
      );
      expect(mockLedgerAccountRepo.findById).toHaveBeenNthCalledWith(
        2,
        equityAccount.id,
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
      const { journalEntry } = makeJournalEntry(EJournalEntryStatus.Draft);

      await service.propagate(journalEntry, mockOptions);

      expect(mockLedgerAccountRepo.findById).not.toHaveBeenCalled();
      expect(
        mockLedgerAccountBalanceAdjustmentQueue.add
      ).not.toHaveBeenCalled();
    });

    it('should throw if a journal line account cannot be found', async () => {
      const { journalEntry, postingAccount } = makeJournalEntry(
        EJournalEntryStatus.Posted
      );

      mockLedgerAccountRepo.findById.mockResolvedValue(null);

      await expect(
        service.propagate(journalEntry, mockOptions)
      ).rejects.toThrow(journalEntryError.AccountNotFound);

      expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
        postingAccount.id,
        mockOptions
      );
      expect(
        mockLedgerAccountBalanceAdjustmentQueue.add
      ).not.toHaveBeenCalled();
    });

    it('should throw if journal line currencies do not match the ledger account', async () => {
      const { journalEntry, postingAccount } =
        makeForeignCurrencyJournalEntry();

      mockLedgerAccountRepo.findById.mockResolvedValue(postingAccount);

      await expect(
        service.propagate(journalEntry, mockOptions)
      ).rejects.toThrow(journalEntryError.MismatchedJournalLines);

      expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
        postingAccount.id,
        mockOptions
      );
      expect(
        mockLedgerAccountBalanceAdjustmentQueue.add
      ).not.toHaveBeenCalled();
    });
  });
});
