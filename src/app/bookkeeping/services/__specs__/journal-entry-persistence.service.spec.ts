import { SYSTEM_JURISDICTIONS } from '../../../../domain/accounting/config/jurisdictions.config';
import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  IJournalEntryHistory,
  IJournalLineHistory,
} from '../../../../domain/journal-entry/types/journal-entry-audit.types';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import openingBalanceEquityLedgerEntity from '../../../../domain/ledger/equity-account/entities/opening-balance-equity.entity';
import userEntity from '../../../../domain/user/entities/user.entity';
import mockJournalEntryRepo from '../../../../infra/persistence/repos/journal-entry/__mocks__/journal-entry.repo.impl.mock';
import mockJournalLineRepo from '../../../../infra/persistence/repos/journal-entry/__mocks__/journal-line.repo.impl.mock';
import mockReporter from '../../../../shared/contracts/__mocks__/reporter.contract.mock';
import mockLedgerAccountBalancePropagationService from '../../contracts/__mocks__/ledger-account-balance-adjustment-service.contract.mock';

import mockRepoService from '../../../../shared/contracts/__mocks__/repo.contract.mock';
import { EHistoryActorType } from '../../../../shared/types/history.types';
import { IRepoOptions } from '../../../../shared/types/repo.types';
import moneyValue from '../../../../shared/value-objects/money.vo';
import makeJournalEntryPersistenceService from '../journal-entry-persistence.service';

describe('journalEntryPersistenceService', () => {
  const service = makeJournalEntryPersistenceService({
    repoService: mockRepoService,
    journalEntryRepo: mockJournalEntryRepo,
    journalLineRepo: mockJournalLineRepo,
    balancePropagationService: mockLedgerAccountBalancePropagationService,
    reporter: mockReporter,
  });

  const mockOptions: IRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  const jurisdictionCode: keyof typeof SYSTEM_JURISDICTIONS = 'NG';
  const timestamp = new Date('2026-06-15T10:30:00.000Z');

  function makeFixture() {
    const [user] = userEntity.make({
      email: 'journal.persistence@example.com',
      emailVerified: true,
      firstName: 'Journal',
      lastName: 'Persistence',
    });

    const [accountingEntity] = accountingEntityEntity.make({
      name: 'Journal Persistence LLC',
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

    const [cashAccount] = cashAndEquivalentAccountEntity.makePettyCashAccount(
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

    const amount = moneyValue.make(100000n, SYSTEM_CURRENCIES.NGN, true);
    const [journalEntry, , audit] = journalEntryEntity.make({
      accountingEntityId: accountingEntity.id,
      sourceType: EJournalEntrySourceType.OpeningBalance,
      counterPartyId: null,
      status: EJournalEntryStatus.Posted,
      effectiveDate: timestamp,
      postedAt: timestamp,
      voidedAt: null,
      voidingEntryId: null,
      memo: 'Opening balance',
      createdBy: user.id,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: cashAccount.id,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          amount,
          exchangeRate: null,
          sequenceOrder: 1,
          side: EJournalSide.Debit,
          description: 'Opening balance',
        },
        {
          accountId: equityAccount.id,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          amount,
          exchangeRate: null,
          sequenceOrder: 2,
          side: EJournalSide.Credit,
          description: 'Opening balance',
        },
      ],
    });

    const actor = {
      type: EHistoryActorType.User,
      userId: user.id,
    };
    const headerHistory: IJournalEntryHistory = {
      ...audit.header,
      actor,
      correlationId: mockOptions.correlationId,
    };
    const linesHistory: IJournalLineHistory[] = audit.lines.map(
      (lineAudit) => ({
        ...lineAudit,
        actor,
        correlationId: mockOptions.correlationId,
      })
    );

    return {
      headerHistory,
      journalEntry,
      linesHistory,
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(timestamp);
    jest.clearAllMocks();
    mockJournalEntryRepo.create.mockResolvedValue(undefined);
    mockJournalLineRepo.create.mockResolvedValue(undefined);
    mockLedgerAccountBalancePropagationService.propagate.mockResolvedValue(
      undefined
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('should persist the journal entry header and lines in a transaction, then propagate balances', async () => {
      const { headerHistory, journalEntry, linesHistory } = makeFixture();
      const { lines, ...header } = journalEntry;

      await service.create(
        journalEntry,
        headerHistory,
        linesHistory,
        mockOptions
      );

      expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
      expect(mockJournalEntryRepo.create).toHaveBeenCalledWith(header, {
        ...mockOptions,
        tx: expect.anything(),
        history: headerHistory,
      });
      expect(mockJournalLineRepo.create).toHaveBeenCalledWith(lines, {
        ...mockOptions,
        tx: expect.anything(),
        history: linesHistory,
        accountingEntityId: journalEntry.accountingEntityId,
      });
      expect(
        mockLedgerAccountBalancePropagationService.propagate
      ).toHaveBeenCalledWith(journalEntry, mockOptions);
    });

    it('should stop before creating lines or propagating balances if header persistence fails', async () => {
      const { headerHistory, journalEntry, linesHistory } = makeFixture();
      const error = new Error('header persistence failed');

      mockJournalEntryRepo.create.mockRejectedValue(error);

      await expect(
        service.create(journalEntry, headerHistory, linesHistory, mockOptions)
      ).rejects.toThrow(error);

      expect(mockJournalEntryRepo.create).toHaveBeenCalledTimes(1);
      expect(mockJournalLineRepo.create).not.toHaveBeenCalled();
      expect(
        mockLedgerAccountBalancePropagationService.propagate
      ).not.toHaveBeenCalled();
    });

    it('should stop before propagating balances if line persistence fails', async () => {
      const { headerHistory, journalEntry, linesHistory } = makeFixture();
      const error = new Error('line persistence failed');

      mockJournalLineRepo.create.mockRejectedValue(error);

      await expect(
        service.create(journalEntry, headerHistory, linesHistory, mockOptions)
      ).rejects.toThrow(error);

      expect(mockJournalEntryRepo.create).toHaveBeenCalledTimes(1);
      expect(mockJournalLineRepo.create).toHaveBeenCalledTimes(1);
      expect(
        mockLedgerAccountBalancePropagationService.propagate
      ).not.toHaveBeenCalled();
    });

    it('should catch and report balance propagation errors after persistence succeeds', async () => {
      const { headerHistory, journalEntry, linesHistory } = makeFixture();
      const error = new Error('balance propagation failed');

      mockLedgerAccountBalancePropagationService.propagate.mockRejectedValue(
        error
      );

      await expect(
        service.create(journalEntry, headerHistory, linesHistory, mockOptions)
      ).resolves.toBeUndefined();

      expect(mockJournalEntryRepo.create).toHaveBeenCalledTimes(1);
      expect(mockJournalLineRepo.create).toHaveBeenCalledTimes(1);
      expect(
        mockLedgerAccountBalancePropagationService.propagate
      ).toHaveBeenCalledWith(journalEntry, mockOptions);
      expect(mockReporter.report).toHaveBeenCalledWith(error);
    });
  });
});
