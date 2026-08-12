import { IReadRepoOptions } from '@shared/types/repo.types';
import generateUUID from '@shared/utils/uuid-generator';

import accountingEntityEntity from '@domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';
import IAccountingPeriodService from '@domain/accounting/types/accounting-period.service.types';
import {
  EPeriodStatus,
  EPeriodUnit,
  IAccountingPeriod,
} from '@domain/accounting/types/period.types';
import counterpartyEntity from '@domain/counterparty/entities/counterparty.entity';
import { ECounterpartyType } from '@domain/counterparty/types/counterparty.types';
import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import journalLineError from '@domain/journal-entry/errors/journal-line.error';
import { EJournalEntryEvent } from '@domain/journal-entry/events/journal-entry.events';
import { EJournalLineItemEvent } from '@domain/journal-entry/events/journal-line-item.events';
import makeJournalEntryService from '@domain/journal-entry/services/journal-entry.service';
import {
  EJournalEntryAuditAction,
  EJournalLineAuditAction,
} from '@domain/journal-entry/types/journal-entry-audit.types';
import { ICreateReceiptEntryPayload } from '@domain/journal-entry/types/journal-entry.service.types';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '@domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import ledgerAccountBalanceEntity from '@domain/ledger/entities/ledger-account-balance.entity';
import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import ILedgerAccountBalanceRepo from '@domain/ledger/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import makeCashAccountService from '@domain/ledger/services/asset-account/cash-account.service';
import makeEquityAccountService from '@domain/ledger/services/equity-account/equity-account.service';
import makeServicesAccountService from '@domain/ledger/services/revenue-account/services.service';
import { EEquitySubType } from '@domain/ledger/types/equity-account.types';
import { ELedgerType } from '@domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import { EExchangeRateType } from '@domain/money/types/exchange-rate.types';
import exchangeRateValue from '@domain/money/values/exchange-rate.vo';
import moneyValue from '@domain/money/values/money.vo';
import userEntity from '@domain/user/entities/user.entity';

const mockAccountingPeriodService: jest.Mocked<IAccountingPeriodService> = {
  validatePostingPeriod: jest.fn(),
};

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

describe('journalEntryService', () => {
  const timestamp = new Date('2026-08-04T10:00:00.000Z');
  const effectiveDate = new Date('2026-08-03T10:00:00.000Z');
  const repoOptions: IReadRepoOptions = {
    correlationId: 'journal-entry-service-test',
  };
  const openPeriod: IAccountingPeriod = {
    id: generateUUID(),
    name: 'August 2026',
    accountingEntityId: generateUUID(),
    unit: EPeriodUnit.Month,
    count: 1,
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    endDate: new Date('2026-08-31T23:59:59.999Z'),
    status: EPeriodStatus.Open,
    fiscalYearId: generateUUID(),
    closedAt: null,
    updatedAt: timestamp,
  };
  const service = makeJournalEntryService({
    accountingPeriodService: mockAccountingPeriodService,
    ledgerAccountBalanceRepo: mockLedgerAccountBalanceRepo,
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const equityAccountService = makeEquityAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const servicesAccountService = makeServicesAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });

  async function makeReceiptFixture(postedAt: Date | null = null) {
    const [user] = userEntity.make({
      email: 'receipt@example.com',
      emailVerified: true,
      firstName: 'Receipt',
      lastName: 'Maker',
    });
    const [accountingEntity] = accountingEntityEntity.make({
      name: 'Receipt LLC',
      type: EAccountingEntityType.PrivateCompany,
      ownerId: user.id,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode: 'NG',
    });
    const [counterparty] = counterpartyEntity.make({
      accountingEntityId: accountingEntity.id,
      name: 'Receipt Customer',
      type: ECounterpartyType.Organization,
    });
    const [taxAuthority] = counterpartyEntity.make({
      accountingEntityId: accountingEntity.id,
      name: 'Tax Authority',
      type: ECounterpartyType.Organization,
    });
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);
    const [servicesHeader] = await servicesAccountService.createHeader(
      {
        name: 'Services',
        createdBy: user.id,
        accountingEntity,
      },
      repoOptions
    );
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(servicesHeader);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    const [sourceAccountWithoutOpeningDate] =
      await servicesAccountService.createSubAccount(
        {
          name: 'Service Revenue',
          accountingEntityId: accountingEntity.id,
          isControlAccount: false,
          controlAccountCode: servicesHeader.code,
          createdBy: user.id,
        },
        repoOptions
      );
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);
    const [cashHeader] = await cashAccountService.createHeader(
      {
        name: 'Cash and Cash Equivalents',
        accountingEntity,
        userId: user.id,
      },
      repoOptions
    );
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(cashHeader);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    const [destinationAccountWithoutOpeningDate] =
      await cashAccountService.createPettyCashSubAccount(
        {
          name: 'Cash on Hand',
          currency: SYSTEM_CURRENCIES.NGN,
          isControlAccount: false,
          controlAccountCode: cashHeader.code,
          accountingEntity,
          userId: user.id,
        },
        repoOptions
      );
    const [sourceAccount] = ledgerAccountEntity.updateOpeningBalanceDate(
      sourceAccountWithoutOpeningDate,
      effectiveDate
    );
    const [destinationAccount] = ledgerAccountEntity.updateOpeningBalanceDate(
      destinationAccountWithoutOpeningDate,
      effectiveDate
    );
    const amount = moneyValue.make(10_000n, SYSTEM_CURRENCIES.NGN, true);

    const payload: ICreateReceiptEntryPayload = {
      header: {
        accountingEntityId: accountingEntity.id,
        memo: 'Customer receipt',
        effectiveDate,
        postedAt,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        createdBy: user.id,
      },
      sourceLine: {
        account: sourceAccount,
        counterparty,
        sequenceOrder: 1,
        amount,
        exchangeRate: null,
        description: 'Service payment',
        meta: null,
      },
      destinationLines: [
        {
          account: destinationAccount,
          counterparty: taxAuthority,
          sequenceOrder: 2,
          amount,
          exchangeRate: null,
          description: 'Cash received',
          meta: null,
        },
      ],
    };

    return {
      payload,
      counterparty,
      taxAuthority,
      sourceAccount,
      destinationAccount,
      user,
      accountingEntity,
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(timestamp);
    jest.clearAllMocks();
    mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue(
      []
    );
    mockAccountingPeriodService.validatePostingPeriod.mockResolvedValue(
      openPeriod
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a draft receipt with mapped lines, events, and audits', async () => {
    const {
      payload,
      counterparty,
      taxAuthority,
      sourceAccount,
      destinationAccount,
    } = await makeReceiptFixture();

    const [entry, events, audit] = await service.createReceipt(
      payload,
      repoOptions
    );

    expect(entry).toEqual(
      expect.objectContaining({
        accountingEntityId: payload.header.accountingEntityId,
        sourceType: EJournalEntrySourceType.Receipt,
        status: EJournalEntryStatus.Draft,
        postedAt: null,
      })
    );
    expect(entry.lines).toEqual([
      expect.objectContaining({
        accountId: sourceAccount.id,
        counterpartyId: counterparty.id,
        sequenceOrder: 1,
        side: EJournalSide.Credit,
        description: 'Service payment',
      }),
      expect.objectContaining({
        accountId: destinationAccount.id,
        counterpartyId: taxAuthority.id,
        sequenceOrder: 2,
        side: EJournalSide.Debit,
        description: 'Cash received',
      }),
    ]);
    expect(events.map((event) => event.type)).toEqual([
      EJournalEntryEvent.Created,
      EJournalLineItemEvent.Created,
      EJournalLineItemEvent.Created,
    ]);
    expect(audit.header.action).toBe(EJournalEntryAuditAction.Created);
    expect(audit.lines.map((lineAudit) => lineAudit.action)).toEqual([
      EJournalLineAuditAction.Created,
      EJournalLineAuditAction.Created,
    ]);
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).toHaveBeenCalledWith(
      payload.header.accountingEntityId,
      payload.header.effectiveDate,
      repoOptions
    );
  });

  it('creates a posted receipt when a posting date is provided', async () => {
    const { payload } = await makeReceiptFixture(timestamp);

    const [entry] = await service.createReceipt(payload, repoOptions);

    expect(entry.status).toBe(EJournalEntryStatus.Posted);
    expect(entry.postedAt).toBe(timestamp);
  });

  it('rejects a non-permitted source account', async () => {
    const { payload } = await makeReceiptFixture();
    payload.sourceLine = {
      ...payload.sourceLine,
      account: payload.destinationLines[0].account,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidSourceType
    );
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).not.toHaveBeenCalled();
  });

  it('rejects a non-permitted destination account', async () => {
    const { payload } = await makeReceiptFixture();
    payload.destinationLines[0] = {
      ...payload.destinationLines[0],
      account: payload.sourceLine.account,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidDestinationAccount
    );
  });

  it('rejects an account belonging to another accounting entity', async () => {
    const { payload, user } = await makeReceiptFixture();
    const [otherAccountingEntity] = accountingEntityEntity.make({
      name: 'Other Entity',
      type: EAccountingEntityType.PrivateCompany,
      ownerId: user.id,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode: 'NG',
    });
    const [otherCashHeader] = await cashAccountService.createHeader(
      {
        name: 'Other Entity Cash Header',
        accountingEntity: otherAccountingEntity,
        userId: user.id,
      },
      repoOptions
    );
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(otherCashHeader);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    const [account] = await cashAccountService.createPettyCashSubAccount(
      {
        name: 'Other Entity Cash',
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountCode: otherCashHeader.code,
        accountingEntity: otherAccountingEntity,
        userId: user.id,
      },
      repoOptions
    );
    payload.destinationLines[0] = {
      ...payload.destinationLines[0],
      account,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidAccountingEntity
    );
  });

  it('rejects a control account', async () => {
    const { payload, accountingEntity, user } = await makeReceiptFixture();
    const [controlAccount] = await cashAccountService.createHeader(
      {
        name: 'Cash Control',
        accountingEntity,
        userId: user.id,
      },
      repoOptions
    );
    payload.destinationLines[0] = {
      ...payload.destinationLines[0],
      account: controlAccount,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.ControlAccountNotAllowed
    );
  });

  it('allows an entry after the account opening balance date', async () => {
    const { payload } = await makeReceiptFixture();
    const openingBalanceDate = new Date('2026-08-01T10:00:00.000Z');
    payload.sourceLine = {
      ...payload.sourceLine,
      account: {
        ...payload.sourceLine.account,
        openingBalanceDate,
      },
    };
    payload.destinationLines[0] = {
      ...payload.destinationLines[0],
      account: {
        ...payload.destinationLines[0].account,
        openingBalanceDate,
      },
    };

    const [entry] = await service.createReceipt(payload, repoOptions);

    expect(entry.effectiveDate).toBe(payload.header.effectiveDate);
  });

  it('allows an entry when account opening balance dates are not set', async () => {
    const { payload } = await makeReceiptFixture();
    payload.sourceLine = {
      ...payload.sourceLine,
      account: {
        ...payload.sourceLine.account,
        openingBalanceDate: null,
      },
    };
    payload.destinationLines[0] = {
      ...payload.destinationLines[0],
      account: {
        ...payload.destinationLines[0].account,
        openingBalanceDate: null,
      },
    };

    const [entry] = await service.createReceipt(payload, repoOptions);

    expect(entry.effectiveDate).toBe(payload.header.effectiveDate);
  });

  it('rejects an entry before the account opening balance date', async () => {
    const { payload } = await makeReceiptFixture();
    const openingBalanceDate = new Date('2026-08-04T09:00:00.000Z');
    payload.sourceLine = {
      ...payload.sourceLine,
      account: {
        ...payload.sourceLine.account,
        openingBalanceDate,
      },
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.EffectiveDateIsBeforeOpeningDate
    );
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).not.toHaveBeenCalled();
  });

  it('rejects a counterparty belonging to another accounting entity after validating the posting period', async () => {
    const { payload } = await makeReceiptFixture();
    const [invalidCounterparty] = counterpartyEntity.make({
      accountingEntityId: generateUUID(),
      name: 'Other Customer',
      type: ECounterpartyType.Organization,
    });
    payload.sourceLine = {
      ...payload.sourceLine,
      counterparty: invalidCounterparty,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidCounterpartyId
    );
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).toHaveBeenCalledTimes(1);
  });

  describe('createOpeningBalance', () => {
    async function makeOpeningBalanceFixture() {
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
        jurisdictionCode: 'NG',
      });
      const [controlAccount] = await cashAccountService.createHeader(
        {
          name: 'Cash and Cash Equivalents',
          accountingEntity,
          userId: user.id,
        },
        repoOptions
      );
      mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
      mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
      const [postingAccount] =
        await cashAccountService.createPettyCashSubAccount(
          {
            name: 'Main Petty Cash',
            currency: SYSTEM_CURRENCIES.NGN,
            isControlAccount: false,
            controlAccountCode: controlAccount.code,
            accountingEntity,
            userId: user.id,
          },
          repoOptions
        );
      const [equityAccount] =
        await equityAccountService.createOpeningBalanceAccount(
          {
            name: 'Opening Balance Equity',
            createdBy: user.id,
            accountingEntity,
          },
          repoOptions
        );

      return {
        accountingEntity,
        amount: moneyValue.make(125_000n, SYSTEM_CURRENCIES.NGN, true),
        controlAccount,
        equityAccount,
        postingAccount,
        user,
      };
    }

    function makeOpeningBalancePayload(
      fixture: Awaited<ReturnType<typeof makeOpeningBalanceFixture>>
    ) {
      return {
        accountingEntityId: fixture.accountingEntity.id,
        functionalCurrencyCode: fixture.accountingEntity.functionalCurrencyCode,
        account: fixture.postingAccount,
        amount: fixture.amount,
        effectiveDate: timestamp,
        exchangeRate: null,
        createdBy: fixture.user.id,
      };
    }

    it('creates a posted opening balance with the configured equity account', async () => {
      const fixture = await makeOpeningBalanceFixture();
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        fixture.equityAccount,
      ]);

      const [entry, events, audit] = await service.createOpeningBalance(
        makeOpeningBalancePayload(fixture),
        repoOptions
      );

      expect(entry).toEqual(
        expect.objectContaining({
          accountingEntityId: fixture.accountingEntity.id,
          sourceType: EJournalEntrySourceType.OpeningBalance,
          status: EJournalEntryStatus.Posted,
          effectiveDate: timestamp,
          postedAt: timestamp,
          memo: 'Opening balance',
          createdBy: fixture.user.id,
        })
      );
      expect(entry.lines).toEqual([
        expect.objectContaining({
          accountId: fixture.postingAccount.id,
          sequenceOrder: 1,
          amount: fixture.amount,
          side: EJournalSide.Debit,
          description: 'Opening balance',
        }),
        expect.objectContaining({
          accountId: fixture.equityAccount.id,
          sequenceOrder: 2,
          amount: fixture.amount,
          side: EJournalSide.Credit,
          description: 'Opening balance',
        }),
      ]);
      expect(events).toHaveLength(3);
      expect(audit.header.action).toBe(EJournalEntryAuditAction.Created);
      expect(
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId
      ).toHaveBeenCalledWith(fixture.postingAccount.id, repoOptions);
      expect(mockLedgerAccountRepo.findBySubType).toHaveBeenCalledWith(
        fixture.accountingEntity.id,
        ELedgerType.Equity,
        EEquitySubType.OpeningBalance,
        repoOptions
      );
    });

    it('rejects a control account before repository checks', async () => {
      const fixture = await makeOpeningBalanceFixture();

      await expect(
        service.createOpeningBalance(
          {
            ...makeOpeningBalancePayload(fixture),
            account: fixture.controlAccount,
          },
          repoOptions
        )
      ).rejects.toThrow(
        journalEntryError.ControlAccountOpeningBalanceNotAllowed
      );
      expect(
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId
      ).not.toHaveBeenCalled();
      expect(mockLedgerAccountRepo.findBySubType).not.toHaveBeenCalled();
    });

    it('rejects an account with an existing opening balance date before repository checks', async () => {
      const fixture = await makeOpeningBalanceFixture();

      await expect(
        service.createOpeningBalance(
          {
            ...makeOpeningBalancePayload(fixture),
            account: {
              ...fixture.postingAccount,
              openingBalanceDate: new Date('2026-08-01T00:00:00.000Z'),
            },
          },
          repoOptions
        )
      ).rejects.toThrow(journalEntryError.ExistingOpeningBalance);
      expect(
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId
      ).not.toHaveBeenCalled();
    });

    it('rejects an account with an existing balance adjustment', async () => {
      const fixture = await makeOpeningBalanceFixture();
      const balance = ledgerAccountBalanceEntity.make({
        ledgerAccountId: fixture.postingAccount.id,
        accountingEntityId: fixture.accountingEntity.id,
        accountMaterializedPath: fixture.postingAccount.materializedPath,
        currencyCode: SYSTEM_CURRENCIES.NGN.code,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      });
      const { adjustment } = ledgerAccountBalanceEntity.adjust(balance, {
        ledgerAccountId: fixture.postingAccount.id,
        amount: fixture.amount,
        functionalAmount: fixture.amount,
        journalEntryId: generateUUID(),
        createdBy: fixture.user.id,
      });
      mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue(
        [adjustment]
      );

      await expect(
        service.createOpeningBalance(
          makeOpeningBalancePayload(fixture),
          repoOptions
        )
      ).rejects.toThrow(journalEntryError.ExistingOpeningBalance);
      expect(mockLedgerAccountRepo.findBySubType).not.toHaveBeenCalled();
    });

    it('rejects when the opening balance equity account is not configured', async () => {
      const fixture = await makeOpeningBalanceFixture();
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);

      await expect(
        service.createOpeningBalance(
          makeOpeningBalancePayload(fixture),
          repoOptions
        )
      ).rejects.toThrow(journalEntryError.UnConfiguredOpeningBalanceAccount);
    });

    it('rejects a configured account that violates the opening balance destination rule', async () => {
      const fixture = await makeOpeningBalanceFixture();
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        fixture.postingAccount,
      ]);

      await expect(
        service.createOpeningBalance(
          makeOpeningBalancePayload(fixture),
          repoOptions
        )
      ).rejects.toThrow(journalEntryError.InvalidDestinationAccount);
    });

    it('rejects same-currency opening balances with an exchange rate', async () => {
      const fixture = await makeOpeningBalanceFixture();
      const exchangeRate = exchangeRateValue.make({
        baseCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        rate: 1,
        type: EExchangeRateType.Official,
        asOf: new Date('2026-08-03T10:00:00.000Z'),
        source: 'Test Source',
      });
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        fixture.equityAccount,
      ]);

      await expect(
        service.createOpeningBalance(
          { ...makeOpeningBalancePayload(fixture), exchangeRate },
          repoOptions
        )
      ).rejects.toThrow(journalLineError.UnsupportedExchangeRate);
    });
  });
});
