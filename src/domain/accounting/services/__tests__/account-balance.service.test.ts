import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import mockLedgerAccountBalanceRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account-balance.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import generateUUID from '../../../../shared/utils/uuid-generator';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { SYSTEM_CURRENCIES } from '../../../currency/config/currencies.config';
import { EExchangeRateType } from '../../../currency/types/exchange-rate.types';
import exchangeRateValue from '../../../currency/value-objects/exchange-rate.vo';
import journalEntryEntity from '../../../journal-entry/entities/journal-entry.entity';
import { EJournalEntryStatus } from '../../../journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../journal-entry/types/journal-line.types';
import ledgerAccountEntity from '../../../ledger/entities/shared/ledger-account.entity';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../ledger/types/ledger.types';
import ledgerAccountBalanceEntity from '../../entities/ledger-account-balance.entity';
import makeLedgerAccountBalanceService from '../account-balance.service';

const service = makeLedgerAccountBalanceService(
  mockLedgerAccountBalanceRepo,
  mockLedgerAccountRepo
);

describe('account-balance.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const usd = SYSTEM_CURRENCIES.USD;
  const ngn = SYSTEM_CURRENCIES.NGN;

  const accountingEntityId = generateUUID();
  const createdBy = generateUUID();

  const ledgerAccount = ledgerAccountEntity.make({
    code: '100000',
    materializedPath: '100000',
    accountingEntityId: accountingEntityId,
    type: ELedgerType.Asset,
    normalBalance: ENormalBalance.Debit,
    subType: 'cash',
    behavior: 'cash',
    isControlAccount: false,
    controlAccountId: null,
    name: 'Cash',
    currency: usd,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.NotApplicable,
    adjunctAccountRule: EAdjunctAccountRule.NotApplicable,
    meta: null,
    createdBy: createdBy,
  });

  const repoOptions: IRepoOptions = { correlationId: 'req-1' };

  describe('createBalance', () => {
    it('should return existing balance if it exists', async () => {
      const existingBalance = ledgerAccountBalanceEntity.make({
        ledgerAccountId: ledgerAccount.id,
        accountingEntityId: ledgerAccount.accountingEntityId,
        accountMaterializedPath: ledgerAccount.materializedPath,
        currencyCode: usd.code,
        functionalCurrencyCode: ngn.code,
      });

      mockLedgerAccountBalanceRepo.findBalanceByAccountId.mockResolvedValueOnce(
        existingBalance
      );

      const result = await service.createBalance(
        ledgerAccount,
        ngn,
        repoOptions
      );

      expect(
        mockLedgerAccountBalanceRepo.findBalanceByAccountId
      ).toHaveBeenCalledWith(
        ledgerAccount.id,
        ledgerAccount.accountingEntityId,
        repoOptions
      );
      expect(result).toBe(existingBalance);
    });

    it('should create and return new balance if it does not exist', async () => {
      mockLedgerAccountBalanceRepo.findBalanceByAccountId.mockResolvedValueOnce(
        null
      );

      const result = await service.createBalance(
        ledgerAccount,
        ngn,
        repoOptions
      );

      expect(result.ledgerAccountId).toBe(ledgerAccount.id);
      expect(result.accountingEntityId).toBe(ledgerAccount.accountingEntityId);
      expect(result.accountMaterializedPath).toBe(
        ledgerAccount.materializedPath
      );
      expect(result.amount.amount).toBe(0n);
      expect(result.amount.currency.code).toBe('USD');
      expect(result.functionalAmount.currency.code).toBe('NGN');
      expect(result.functionalAmount.amount).toBe(0n);
    });
  });

  describe('makeRecursiveAdjustments', () => {
    const transactionId = generateUUID();
    const accountId2 = generateUUID();

    const [journalEntry] = journalEntryEntity.make({
      accountingEntityId,
      transactionId,
      status: EJournalEntryStatus.Posted,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      postedAt: new Date('2026-01-01T00:00:00.000Z'),
      voidedAt: null,
      voidingEntryId: null,
      memo: 'test memo',
      createdBy,
      functionalCurrency: ngn,
      lines: [
        {
          accountId: ledgerAccount.id,
          sequenceOrder: 1,
          amount: moneyValue.make(100, usd, false),
          functionalCurrency: ngn,
          exchangeRate: exchangeRateValue.make({
            baseCurrencyCode: 'USD',
            targetCurrencyCode: 'NGN',
            rate: 1500,
            type: EExchangeRateType.Official,
            asOf: new Date('2026-01-01T00:00:00.000Z'),
            source: 'test',
          }),
          side: EJournalSide.Debit,
        },
        {
          accountId: accountId2,
          sequenceOrder: 2,
          amount: moneyValue.make(100, usd, false),
          functionalCurrency: ngn,
          exchangeRate: exchangeRateValue.make({
            baseCurrencyCode: 'USD',
            targetCurrencyCode: 'NGN',
            rate: 1500,
            type: EExchangeRateType.Official,
            asOf: new Date('2026-01-01T00:00:00.000Z'),
            source: 'test',
          }),
          side: EJournalSide.Credit,
        },
      ],
    });

    const payload = {
      balanceDelta: moneyValue.make(100, usd, false),
      functionalBalanceDelta: moneyValue.make(150000, ngn, false), // 1500 * 100
      affectedLedgerCodes: ['100000', '100001'],
      journalEntry,
    };

    it('should throw AppError if account does not exist', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      await expect(
        service.makeRecursiveAdjustments(payload, repoOptions)
      ).rejects.toThrow('Account does not exist');
    });

    it('should throw AppError if balance not found for account', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(ledgerAccount);
      mockLedgerAccountBalanceRepo.findBalanceByAccountId.mockResolvedValue(
        null
      );

      await expect(
        service.makeRecursiveAdjustments(payload, repoOptions)
      ).rejects.toThrow('Balance not found for account');
    });

    it('should make recursive adjustments correctly handling both same and different currencies', async () => {
      const account1 = ledgerAccountEntity.make({
        code: '100001',
        materializedPath: '100000.100001',
        accountingEntityId,
        type: ELedgerType.Asset,
        normalBalance: ENormalBalance.Debit,
        subType: 'cash',
        behavior: 'cash',
        isControlAccount: false,
        controlAccountId: null,
        name: 'Sub Cash',
        currency: usd,
        status: ELedgerAccountStatus.Active,
        contraAccountRule: EContraAccountRule.NotApplicable,
        adjunctAccountRule: EAdjunctAccountRule.NotApplicable,
        meta: null,
        createdBy,
      });

      const account2 = ledgerAccountEntity.make({
        code: '100000',
        materializedPath: '100000',
        accountingEntityId,
        type: ELedgerType.Asset,
        normalBalance: ENormalBalance.Debit,
        subType: 'cash',
        behavior: 'cash',
        isControlAccount: false,
        controlAccountId: null,
        name: 'Header Cash',
        currency: ngn,
        status: ELedgerAccountStatus.Active,
        contraAccountRule: EContraAccountRule.NotApplicable,
        adjunctAccountRule: EAdjunctAccountRule.NotApplicable,
        meta: null,
        createdBy,
      });

      mockLedgerAccountRepo.findByCode.mockImplementation(async (code) => {
        if (code === '100001') return account1;
        if (code === '100000') return account2;
        return null;
      });

      const existingBalance1 = ledgerAccountBalanceEntity.make({
        ledgerAccountId: account1.id,
        accountingEntityId: account1.accountingEntityId,
        accountMaterializedPath: account1.materializedPath,
        currencyCode: account1.currency.code,
        functionalCurrencyCode: ngn.code,
      });

      const existingBalance2 = ledgerAccountBalanceEntity.make({
        ledgerAccountId: account2.id,
        accountingEntityId: account2.accountingEntityId,
        accountMaterializedPath: account2.materializedPath,
        currencyCode: account2.currency.code,
        functionalCurrencyCode: ngn.code,
      });

      mockLedgerAccountBalanceRepo.findBalanceByAccountId.mockImplementation(
        async (id) => {
          if (id === account1.id) return existingBalance1;
          if (id === account2.id) return existingBalance2;
          return null;
        }
      );

      const result = await service.makeRecursiveAdjustments(
        payload,
        repoOptions
      );

      expect(result.length).toBe(2);

      // Reversed codes means '100001' is processed first
      const adj1 = result[0].adjustment;
      const newBal1 = result[0].newBalance;

      expect(adj1.ledgerAccountId).toBe(account1.id);
      expect(adj1.amount.amount).toBe(payload.balanceDelta.amount);
      expect(adj1.amount.currency.code).toBe('USD');
      expect(adj1.functionalAmount.amount).toBe(
        payload.functionalBalanceDelta.amount
      );
      expect(adj1.functionalAmount.currency.code).toBe('NGN');
      expect(newBal1.amount.amount).toBe(payload.balanceDelta.amount);

      // '100000' is processed second (different currency, so both amount and functionalAmount use functionalBalanceDelta)
      const adj2 = result[1].adjustment;
      const newBal2 = result[1].newBalance;

      expect(adj2.ledgerAccountId).toBe(account2.id);
      expect(adj2.amount.amount).toBe(payload.functionalBalanceDelta.amount);
      expect(adj2.amount.currency.code).toBe('NGN');
      expect(adj2.functionalAmount.amount).toBe(
        payload.functionalBalanceDelta.amount
      );
      expect(adj2.functionalAmount.currency.code).toBe('NGN');
      expect(newBal2.amount.amount).toBe(payload.functionalBalanceDelta.amount);
    });
  });
});
