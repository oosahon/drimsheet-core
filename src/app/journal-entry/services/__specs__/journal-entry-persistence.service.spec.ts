import { SYSTEM_JURISDICTIONS } from '../../../../domain/accounting/config/jurisdictions.config';
import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  IJournalEntryHistory,
  IJournalLineHistory,
} from '../../../../domain/journal-entry/types/journal-entry-audit.types';
import { EJournalEntrySourceType } from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import openingBalanceEquityLedgerEntity from '../../../../domain/ledger/equity-account/entities/opening-balance-equity.entity';
import makeCashAccountService from '../../../../domain/ledger/services/cash-account.service';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import moneyValue from '../../../../domain/money/values/money.vo';
import userEntity from '../../../../domain/user/entities/user.entity';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.mock';
import {
  IRepoOptions,
  ITransactionContext,
} from '../../../../shared/types/repo.types';
import { EHistoryActorType } from '../../../../shared/values/history/types/history.types';
import { mockLedgerAccountRepo } from '../../../ledger/contracts/__mocks__/ledger.repos.mock';
import {
  mockJournalEntryRepo,
  mockJournalLineRepo,
} from '../../contracts/__mocks__/journal-entry.repos.mock';
import makeJournalEntryPersistenceService from '../journal-entry-persistence.service';

describe('journalEntryPersistenceService', () => {
  const service = makeJournalEntryPersistenceService({
    repoService: mockRepoService,
    journalEntryRepo: mockJournalEntryRepo,
    journalLineRepo: mockJournalLineRepo,
  });
  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });

  const mockOptions: IRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  const jurisdictionCode: keyof typeof SYSTEM_JURISDICTIONS = 'NG';
  const timestamp = new Date('2026-06-15T10:30:00.000Z');

  async function makeFixture() {
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
    const [cashAccount] = await cashAccountService.createPettyCashSubAccount(
      {
        name: 'Main Petty Cash',
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountCode: controlAccount.code,
        accountingEntity,
        userId: user.id,
      },
      mockOptions
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
      effectiveDate: timestamp,
      postedAt: timestamp,
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
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );
    mockJournalEntryRepo.create.mockResolvedValue(undefined);
    mockJournalLineRepo.create.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('should persist the journal entry header and lines in a transaction', async () => {
      const { headerHistory, journalEntry, linesHistory } = await makeFixture();
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
    });

    it('should stop before creating lines if header persistence fails', async () => {
      const { headerHistory, journalEntry, linesHistory } = await makeFixture();
      const error = new Error('header persistence failed');

      mockJournalEntryRepo.create.mockRejectedValue(error);

      await expect(
        service.create(journalEntry, headerHistory, linesHistory, mockOptions)
      ).rejects.toThrow(error);

      expect(mockJournalEntryRepo.create).toHaveBeenCalledTimes(1);
      expect(mockJournalLineRepo.create).not.toHaveBeenCalled();
    });

    it('should fail if line persistence fails', async () => {
      const { headerHistory, journalEntry, linesHistory } = await makeFixture();
      const error = new Error('line persistence failed');

      mockJournalLineRepo.create.mockRejectedValue(error);

      await expect(
        service.create(journalEntry, headerHistory, linesHistory, mockOptions)
      ).rejects.toThrow(error);

      expect(mockJournalEntryRepo.create).toHaveBeenCalledTimes(1);
      expect(mockJournalLineRepo.create).toHaveBeenCalledTimes(1);
    });
  });
});
