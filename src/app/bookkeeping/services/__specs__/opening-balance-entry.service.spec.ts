import { SYSTEM_JURISDICTIONS } from '../../../../domain/accounting/config/jurisdictions.config';
import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import journalEntryError from '../../../../domain/journal-entry/errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import openingBalanceEquityLedgerEntity from '../../../../domain/ledger/entities/03-equity-account/99-opening-balance-equity.entity';
import ledgerAccountBalanceEntity from '../../../../domain/ledger/entities/shared/ledger-account-balance.entity';
import { EEquitySubType } from '../../../../domain/ledger/types/equity-account.types';
import { ELedgerType } from '../../../../domain/ledger/types/ledger.types';
import userEntity from '../../../../domain/user/entities/user.entity';
import mockLedgerAccountBalanceRepo from '../../../../infra/persistence/repos/ledger/__mocks__/ledger-account-balance.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import moneyValue from '../../../../shared/value-objects/money.vo';
import makeOpeningBalanceEntryService from '../opening-balance-entry.service';

describe('openingBalanceEntryService', () => {
  const service = makeOpeningBalanceEntryService(
    mockLedgerAccountBalanceRepo,
    mockLedgerAccountRepo
  );

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
      const { accountingEntity, amount, equityAccount, postingAccount, user } =
        makeFixture();

      mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue(
        []
      );
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([equityAccount]);

      const [journalEntry, events, audit] = await service.create(
        accountingEntity,
        postingAccount,
        amount,
        null,
        mockOptions
      );

      expect(journalEntry).toEqual(
        expect.objectContaining({
          accountingEntityId: accountingEntity.id,
          sourceType: EJournalEntrySourceType.OpeningBalance,
          counterPartyId: null,
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
          sequenceOrder: 1,
          amount,
          functionalAmount: amount,
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Opening balance',
          version: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
        expect.objectContaining({
          accountId: equityAccount.id,
          sequenceOrder: 2,
          amount,
          functionalAmount: amount,
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
      const { accountingEntity, amount, controlAccount } = makeFixture();

      await expect(
        service.create(
          accountingEntity,
          controlAccount,
          amount,
          null,
          mockOptions
        )
      ).rejects.toThrow(
        journalEntryError.ControlAccountOpeningBalanceNotAllowed
      );

      expect(
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId
      ).not.toHaveBeenCalled();
      expect(mockLedgerAccountRepo.findBySubType).not.toHaveBeenCalled();
    });

    it('should reject accounts that already have an opening balance adjustment', async () => {
      const { accountingEntity, amount, postingAccount, user } = makeFixture();
      const existingBalance = ledgerAccountBalanceEntity.make({
        ledgerAccountId: postingAccount.id,
        accountingEntityId: accountingEntity.id,
        accountMaterializedPath: postingAccount.materializedPath,
        currencyCode: SYSTEM_CURRENCIES.NGN.code,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      });
      const { adjustment } = ledgerAccountBalanceEntity.adjust(
        existingBalance,
        {
          ledgerAccountId: postingAccount.id,
          amount,
          functionalAmount: amount,
          journalEntryId: generateUUID(),
          createdBy: user.id,
        }
      );

      mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue(
        [adjustment]
      );

      await expect(
        service.create(
          accountingEntity,
          postingAccount,
          amount,
          null,
          mockOptions
        )
      ).rejects.toThrow(journalEntryError.ExistingOpeningBalance);

      expect(
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId
      ).toHaveBeenCalledWith(postingAccount.id, mockOptions);
      expect(mockLedgerAccountRepo.findBySubType).not.toHaveBeenCalled();
    });

    it('should reject when the opening balance equity account is not configured', async () => {
      const { accountingEntity, amount, postingAccount } = makeFixture();

      mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue(
        []
      );
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);

      await expect(
        service.create(
          accountingEntity,
          postingAccount,
          amount,
          null,
          mockOptions
        )
      ).rejects.toThrow(journalEntryError.UnconfiguredOpeningBalanceAccount);

      expect(mockLedgerAccountRepo.findBySubType).toHaveBeenCalledWith(
        accountingEntity.id,
        ELedgerType.Equity,
        EEquitySubType.OpeningBalance,
        mockOptions
      );
    });
  });
});
