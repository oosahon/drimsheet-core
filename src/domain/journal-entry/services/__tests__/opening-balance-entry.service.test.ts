import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { SYSTEM_JURISDICTIONS } from '../../../accounting/config/jurisdictions.config';
import accountingEntityEntity from '../../../accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../accounting/types/accounting-entity.types';
import ledgerAccountBalanceEntity from '../../../ledger/account-balance/entities/ledger-account-balance.entity';
import ILedgerAccountBalanceRepo from '../../../ledger/account-balance/repos/ledger-account-balance.repo';
import cashAndEquivalentAccountEntity from '../../../ledger/asset-account/entities/cash-and-equivalents.entity';
import openingBalanceEquityLedgerEntity from '../../../ledger/equity-account/entities/opening-balance-equity.entity';
import { EEquitySubType } from '../../../ledger/equity-account/types/equity-account.types';
import ILedgerAccountRepo from '../../../ledger/shared/repos/ledger-account.repo';
import { ELedgerType } from '../../../ledger/shared/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../money/config/currencies.config';
import { EExchangeRateType } from '../../../money/types/exchange-rate.types';
import exchangeRateValue from '../../../money/values/exchange-rate.vo';
import moneyValue from '../../../money/values/money.vo';
import userEntity from '../../../user/entities/user.entity';
import journalEntryError from '../../errors/journal-entry.error';
import journalLineError from '../../errors/journal-line.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../types/journal-entry.types';
import { EJournalSide } from '../../types/journal-line.types';
import makeOpeningBalanceEntryService from '../opening-balance-entry.service';

const mockLedgerAccountBalanceRepo: jest.Mocked<ILedgerAccountBalanceRepo> = {
  create: jest.fn(),
  adjustBalance: jest.fn(),
  findByAccountId: jest.fn(),
  findAdjustmentsByAccountId: jest.fn(),
  findAllByAccountIds: jest.fn(),
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

describe('openingBalanceEntryService', () => {
  const service = makeOpeningBalanceEntryService({
    ledgerAccountBalanceRepo: mockLedgerAccountBalanceRepo,
    ledgerAccountRepo: mockLedgerAccountRepo,
  });

  const mockOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  const jurisdictionCode: keyof typeof SYSTEM_JURISDICTIONS = 'NG';
  const timestamp = new Date('2026-06-15T10:30:00.000Z');

  function makeFixture() {
    const [user] = userEntity.make({
      email: 'opening.balance@example.com',
      emailVerified: true,
      firstName: 'Opening',
      lastName: 'Balance',
    });

    const [accountingEntity] = accountingEntityEntity.make({
      name: 'Opening Balance LLC',
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

    const amount = moneyValue.make(125000n, SYSTEM_CURRENCIES.NGN, true);

    return {
      accountingEntity,
      amount,
      controlAccount,
      equityAccount,
      postingAccount,
      user,
    };
  }

  function makePayload(
    fixture: ReturnType<typeof makeFixture>,
    effectiveDate = timestamp
  ) {
    return {
      accountingEntityId: fixture.accountingEntity.id,
      functionalCurrencyCode: fixture.accountingEntity.functionalCurrencyCode,
      account: fixture.postingAccount,
      amount: fixture.amount,
      effectiveDate,
      exchangeRate: null,
      createdBy: fixture.user.id,
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(timestamp);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('should create a posted opening balance journal entry', async () => {
      const fixture = makeFixture();
      const { accountingEntity, amount, equityAccount, postingAccount, user } =
        fixture;

      mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue(
        []
      );
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([equityAccount]);

      const [journalEntry, events, audit] = await service.create(
        makePayload(fixture),
        mockOptions
      );

      expect(journalEntry).toEqual(
        expect.objectContaining({
          accountingEntityId: accountingEntity.id,
          sourceType: EJournalEntrySourceType.OpeningBalance,
          memo: 'Opening balance',
          status: EJournalEntryStatus.Posted,
          effectiveDate: timestamp,
          postedAt: timestamp,
          voidedAt: null,
          voidingEntryId: null,
          version: 1,
          createdBy: user.id,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      );

      expect(journalEntry.lines).toHaveLength(2);
      expect(journalEntry.lines).toEqual([
        expect.objectContaining({
          accountId: postingAccount.id,
          counterpartyId: null,
          sequenceOrder: 1,
          amount,
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Opening balance',
          version: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
        expect.objectContaining({
          accountId: equityAccount.id,
          counterpartyId: null,
          sequenceOrder: 2,
          amount,
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: 'Opening balance',
          version: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
      ]);
      expect(events).toHaveLength(3);
      expect(audit.header.diff.after).toEqual(
        expect.objectContaining({
          id: journalEntry.id,
          sourceType: EJournalEntrySourceType.OpeningBalance,
        })
      );

      expect(
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId
      ).toHaveBeenCalledWith(postingAccount.id, mockOptions);
      expect(mockLedgerAccountRepo.findBySubType).toHaveBeenCalledWith(
        accountingEntity.id,
        ELedgerType.Equity,
        EEquitySubType.OpeningBalance,
        mockOptions
      );
    });

    it('should reject control accounts', async () => {
      const fixture = makeFixture();
      const payload = {
        ...makePayload(fixture),
        account: fixture.controlAccount,
      };

      await expect(service.create(payload, mockOptions)).rejects.toThrow(
        journalEntryError.ControlAccountOpeningBalanceNotAllowed
      );

      expect(
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId
      ).not.toHaveBeenCalled();
      expect(mockLedgerAccountRepo.findBySubType).not.toHaveBeenCalled();
    });

    it('should reject same-currency opening balances with an exchange rate', async () => {
      const fixture = makeFixture();
      const exchangeRate = exchangeRateValue.make({
        baseCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        rate: 1,
        type: EExchangeRateType.Official,
        asOf: new Date('2026-06-14T10:30:00.000Z'),
        source: 'Test Source',
      });

      mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue(
        []
      );
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        fixture.equityAccount,
      ]);

      await expect(
        service.create({ ...makePayload(fixture), exchangeRate }, mockOptions)
      ).rejects.toThrow(journalLineError.UnsupportedExchangeRate);

      expect(
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId
      ).toHaveBeenCalledWith(fixture.postingAccount.id, mockOptions);
      expect(mockLedgerAccountRepo.findBySubType).toHaveBeenCalledWith(
        fixture.accountingEntity.id,
        ELedgerType.Equity,
        EEquitySubType.OpeningBalance,
        mockOptions
      );
    });

    it('should reject accounts that already have openingBalanceDate set without making repo calls', async () => {
      const fixture = makeFixture();
      const accountWithOpeningDate = {
        ...fixture.postingAccount,
        openingBalanceDate: new Date('2026-01-01'),
      };

      await expect(
        service.create(
          { ...makePayload(fixture), account: accountWithOpeningDate },
          mockOptions
        )
      ).rejects.toThrow(journalEntryError.ExistingOpeningBalance);

      expect(
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId
      ).not.toHaveBeenCalled();
      expect(mockLedgerAccountRepo.findBySubType).not.toHaveBeenCalled();
    });

    it('should reject accounts that already have an opening balance adjustment', async () => {
      const fixture = makeFixture();
      const existingBalance = ledgerAccountBalanceEntity.make({
        ledgerAccountId: fixture.postingAccount.id,
        accountingEntityId: fixture.accountingEntity.id,
        accountMaterializedPath: fixture.postingAccount.materializedPath,
        currencyCode: SYSTEM_CURRENCIES.NGN.code,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      });
      const { adjustment } = ledgerAccountBalanceEntity.adjust(
        existingBalance,
        {
          ledgerAccountId: fixture.postingAccount.id,
          amount: fixture.amount,
          functionalAmount: fixture.amount,
          journalEntryId: generateUUID(),
          createdBy: fixture.user.id,
        }
      );

      mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue(
        [adjustment]
      );

      await expect(
        service.create(makePayload(fixture), mockOptions)
      ).rejects.toThrow(journalEntryError.ExistingOpeningBalance);

      expect(
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId
      ).toHaveBeenCalledWith(fixture.postingAccount.id, mockOptions);
      expect(mockLedgerAccountRepo.findBySubType).not.toHaveBeenCalled();
    });

    it('should reject when the opening balance equity account is not configured', async () => {
      const fixture = makeFixture();

      mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue(
        []
      );
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);

      await expect(
        service.create(makePayload(fixture), mockOptions)
      ).rejects.toThrow(journalEntryError.UnConfiguredOpeningBalanceAccount);

      expect(mockLedgerAccountRepo.findBySubType).toHaveBeenCalledWith(
        fixture.accountingEntity.id,
        ELedgerType.Equity,
        EEquitySubType.OpeningBalance,
        mockOptions
      );
    });
  });
});
