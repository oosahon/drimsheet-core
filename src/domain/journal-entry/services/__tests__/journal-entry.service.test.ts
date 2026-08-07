import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import accountingEntityEntity from '../../../accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../accounting/types/accounting-entity.types';
import IAccountingPeriodService from '../../../accounting/types/accounting-period.service.types';
import {
  EPeriodStatus,
  EPeriodUnit,
  IAccountingPeriod,
} from '../../../accounting/types/period.types';
import counterpartyEntity from '../../../counterparty/entities/counterparty.entity';
import { ECounterpartyType } from '../../../counterparty/types/counterparty.types';
import ledgerAccountBalanceEntity from '../../../ledger/account-balance/entities/ledger-account-balance.entity';
import ILedgerAccountBalanceRepo from '../../../ledger/account-balance/repos/ledger-account-balance.repo';
import cashAndEquivalentAccountEntity from '../../../ledger/asset-account/entities/cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../ledger/asset-account/types/asset-account.types';
import ledgerAccountEntity from '../../../ledger/entities/ledger-account.entity';
import openingBalanceEquityLedgerEntity from '../../../ledger/equity-account/entities/opening-balance-equity.entity';
import { EEquitySubType } from '../../../ledger/equity-account/types/equity-account.types';
import ILedgerAccountRepo from '../../../ledger/repos/ledger-account.repo';
import servicesAccountEntity from '../../../ledger/revenue-account/entities/services.entity';
import { ELedgerType } from '../../../ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../money/config/currencies.config';
import { EExchangeRateType } from '../../../money/types/exchange-rate.types';
import exchangeRateValue from '../../../money/values/exchange-rate.vo';
import moneyValue from '../../../money/values/money.vo';
import userEntity from '../../../user/entities/user.entity';
import journalEntryError from '../../errors/journal-entry.error';
import journalLineError from '../../errors/journal-line.error';
import { EJournalEntryEvent } from '../../events/journal-entry.events';
import { EJournalLineItemEvent } from '../../events/journal-line-item.events';
import {
  EJournalEntryAuditAction,
  EJournalLineAuditAction,
} from '../../types/journal-entry-audit.types';
import { ICreateReceiptEntryPayload } from '../../types/journal-entry.service.types';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../types/journal-entry.types';
import { EJournalSide } from '../../types/journal-line.types';
import makeJournalEntryService from '../journal-entry.service';

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

  function makeReceiptFixture(postedAt: Date | null = null) {
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
    const [sourceAccountWithoutOpeningDate] = servicesAccountEntity.make(
      {
        name: 'Service Revenue',
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: null,
        meta: null,
        createdBy: user.id,
      },
      null
    );
    const [destinationAccountWithoutOpeningDate] =
      cashAndEquivalentAccountEntity.make(
        {
          name: 'Cash on Hand',
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
    } = makeReceiptFixture();

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
    const { payload } = makeReceiptFixture(timestamp);

    const [entry] = await service.createReceipt(payload, repoOptions);

    expect(entry.status).toBe(EJournalEntryStatus.Posted);
    expect(entry.postedAt).toBe(timestamp);
  });

  it('rejects a non-permitted source account', async () => {
    const { payload } = makeReceiptFixture();
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
    const { payload } = makeReceiptFixture();
    payload.destinationLines[0] = {
      ...payload.destinationLines[0],
      account: payload.sourceLine.account,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidDestinationAccount
    );
  });

  it('rejects an account belonging to another accounting entity', async () => {
    const { payload, user } = makeReceiptFixture();
    const [account] = cashAndEquivalentAccountEntity.make(
      {
        name: 'Other Entity Cash',
        accountingEntityId: generateUUID(),
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
        createdBy: user.id,
      },
      null
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
    const { payload, accountingEntity, user } = makeReceiptFixture();
    const [controlAccount] = cashAndEquivalentAccountEntity.make(
      {
        name: 'Cash Control',
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: true,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
        createdBy: user.id,
      },
      null
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
    const { payload } = makeReceiptFixture();
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

  it('rejects an entry before the account opening balance date', async () => {
    const { payload } = makeReceiptFixture();
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
    const { payload } = makeReceiptFixture();
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
    function makeOpeningBalanceFixture() {
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
        amount: moneyValue.make(125_000n, SYSTEM_CURRENCIES.NGN, true),
        controlAccount,
        equityAccount,
        postingAccount,
        user,
      };
    }

    function makeOpeningBalancePayload(
      fixture: ReturnType<typeof makeOpeningBalanceFixture>
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
      const fixture = makeOpeningBalanceFixture();
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
      const fixture = makeOpeningBalanceFixture();

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
      const fixture = makeOpeningBalanceFixture();

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
      const fixture = makeOpeningBalanceFixture();
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
      const fixture = makeOpeningBalanceFixture();
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);

      await expect(
        service.createOpeningBalance(
          makeOpeningBalancePayload(fixture),
          repoOptions
        )
      ).rejects.toThrow(journalEntryError.UnConfiguredOpeningBalanceAccount);
    });

    it('rejects a configured account that violates the opening balance destination rule', async () => {
      const fixture = makeOpeningBalanceFixture();
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
      const fixture = makeOpeningBalanceFixture();
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
