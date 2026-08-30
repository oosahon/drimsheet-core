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
import {
  ICreatePaymentEntryPayload,
  ICreateReceiptEntryPayload,
  ICreateTransferEntryPayload,
} from '@domain/journal-entry/types/journal-entry.service.types';
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
import makePayablesAccountService from '@domain/ledger/services/liability-account/payables.service';
import makeServicesAccountService from '@domain/ledger/services/revenue-account/services.service';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '@domain/ledger/types/asset-account.types';
import { EEquitySubType } from '@domain/ledger/types/equity-account.types';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
} from '@domain/ledger/types/expense-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '@domain/ledger/types/ledger.types';
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
  findAllByMaterializedPath: jest.fn(),
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
  const payablesAccountService = makePayablesAccountService({
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
    const [payablesHeader] = await payablesAccountService.createHeader(
      {
        name: 'Payables',
        createdBy: user.id,
        accountingEntity,
      },
      repoOptions
    );
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(payablesHeader);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    const [vatPayableAccountWithoutOpeningDate] =
      await payablesAccountService.createStatutoryPayableSubAccount(
        {
          name: 'VAT Payable',
          createdBy: user.id,
          accountingEntity,
          currency: SYSTEM_CURRENCIES.NGN,
          isControlAccount: false,
          controlAccountCode: payablesHeader.code,
          meta: {
            taxAuthority: 'Federal Inland Revenue Service',
            taxType: 'vat',
          },
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
    const [vatPayableAccount] = ledgerAccountEntity.updateOpeningBalanceDate(
      vatPayableAccountWithoutOpeningDate,
      effectiveDate
    );
    const [destinationAccount] = ledgerAccountEntity.updateOpeningBalanceDate(
      destinationAccountWithoutOpeningDate,
      effectiveDate
    );
    const salesAmount = moneyValue.make(9_250n, SYSTEM_CURRENCIES.NGN, true);
    const vatAmount = moneyValue.make(750n, SYSTEM_CURRENCIES.NGN, true);
    const receiptAmount = moneyValue.make(10_000n, SYSTEM_CURRENCIES.NGN, true);

    const payload: ICreateReceiptEntryPayload = {
      attachments: [
        {
          url: 'https://files.example.com/receipt.pdf',
          name: 'receipt.pdf',
          type: 'application/pdf',
          size: 2048,
        },
      ],
      header: {
        accountingEntityId: accountingEntity.id,
        memo: 'Customer receipt',
        effectiveDate,
        postedAt,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        createdBy: user.id,
      },
      sourceLines: [
        {
          account: sourceAccount,
          counterparty,
          sequenceOrder: 1,
          amount: salesAmount,
          exchangeRate: null,
          description: 'Service revenue',
          meta: null,
        },
        {
          account: vatPayableAccount,
          counterparty: taxAuthority,
          sequenceOrder: 2,
          amount: vatAmount,
          exchangeRate: null,
          description: 'VAT payable',
          meta: null,
        },
      ],
      destinationLine: {
        account: destinationAccount,
        counterparty,
        sequenceOrder: 3,
        amount: receiptAmount,
        exchangeRate: null,
        description: 'Cash received',
        meta: null,
      },
    };

    return {
      payload,
      counterparty,
      taxAuthority,
      sourceAccount,
      vatPayableAccount,
      destinationAccount,
      user,
      accountingEntity,
    };
  }

  function makePaymentAccount(
    overrides: Partial<ILedgerAccount>
  ): ILedgerAccount {
    const type = overrides.type ?? ELedgerType.Asset;
    const code = overrides.code ?? '100001';
    const [account] = ledgerAccountEntity.make({
      code,
      materializedPath: code,
      accountingEntityId: overrides.accountingEntityId ?? generateUUID(),
      type,
      subType: overrides.subType ?? EAssetSubType.CashAndCashEquivalent,
      behavior: overrides.behavior ?? EAssetAccountBehavior.Bank,
      normalBalance: ledgerAccountEntity.getNormalBalance(type),
      isControlAccount: false,
      controlAccountId: null,
      name: overrides.name ?? 'Payment account',
      currency: SYSTEM_CURRENCIES.NGN,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      meta: {},
      createdBy: generateUUID(),
      ...overrides,
    });

    return account;
  }

  function makePaymentFixture(postedAt: Date | null = null) {
    const [user] = userEntity.make({
      email: 'payment@example.com',
      emailVerified: true,
      firstName: 'Payment',
      lastName: 'Maker',
    });
    const [accountingEntity] = accountingEntityEntity.make({
      name: 'Payment LLC',
      type: EAccountingEntityType.PrivateCompany,
      ownerId: user.id,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode: 'NG',
    });
    const [counterparty] = counterpartyEntity.make({
      accountingEntityId: accountingEntity.id,
      name: 'Payment Vendor',
      type: ECounterpartyType.Organization,
    });
    const sourceAccount = makePaymentAccount({
      accountingEntityId: accountingEntity.id,
      createdBy: user.id,
      code: '100001',
    });
    const rentAccount = makePaymentAccount({
      accountingEntityId: accountingEntity.id,
      behavior: EExpenseAccountBehavior.RentAndUtilities,
      code: '502001',
      createdBy: user.id,
      subType: EExpenseSubType.RentAndUtilities,
      type: ELedgerType.Expense,
    });
    const payableAccount = makePaymentAccount({
      accountingEntityId: accountingEntity.id,
      code: '201001',
      createdBy: user.id,
      subType: 'payable',
      type: ELedgerType.Liability,
    });

    const payload: ICreatePaymentEntryPayload = {
      attachments: [
        {
          url: 'https://files.example.com/payment.pdf',
          name: 'payment.pdf',
          type: 'application/pdf',
          size: 1024,
        },
      ],
      header: {
        accountingEntityId: accountingEntity.id,
        memo: 'Vendor payment',
        effectiveDate,
        postedAt,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        createdBy: user.id,
      },
      sourceLine: {
        account: sourceAccount,
        counterparty,
        sequenceOrder: 1,
        amount: moneyValue.make(10_000n, SYSTEM_CURRENCIES.NGN, true),
        exchangeRate: null,
        description: 'Bank payment',
        meta: null,
      },
      destinationLines: [
        {
          account: rentAccount,
          counterparty,
          sequenceOrder: 2,
          amount: moneyValue.make(7_000n, SYSTEM_CURRENCIES.NGN, true),
          exchangeRate: null,
          description: 'Rent expense',
          meta: null,
        },
        {
          account: payableAccount,
          counterparty,
          sequenceOrder: 3,
          amount: moneyValue.make(3_000n, SYSTEM_CURRENCIES.NGN, true),
          exchangeRate: null,
          description: 'Payable settlement',
          meta: null,
        },
      ],
    };

    return {
      accountingEntity,
      counterparty,
      payableAccount,
      payload,
      rentAccount,
      sourceAccount,
    };
  }

  function makeTransferFixture(postedAt: Date | null = null) {
    const [user] = userEntity.make({
      email: 'transfer@example.com',
      emailVerified: true,
      firstName: 'Transfer',
      lastName: 'Maker',
    });
    const [accountingEntity] = accountingEntityEntity.make({
      name: 'Transfer LLC',
      type: EAccountingEntityType.PrivateCompany,
      ownerId: user.id,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode: 'NG',
    });
    const sourceAccount = makePaymentAccount({
      accountingEntityId: accountingEntity.id,
      behavior: EAssetAccountBehavior.Bank,
      code: '100001',
      createdBy: user.id,
      name: 'Operating bank',
    });
    const destinationAccount = makePaymentAccount({
      accountingEntityId: accountingEntity.id,
      behavior: EAssetAccountBehavior.PettyCash,
      code: '100002',
      createdBy: user.id,
      name: 'Petty cash',
    });
    const payload: ICreateTransferEntryPayload = {
      attachments: [
        {
          url: 'https://files.example.com/transfer.pdf',
          name: 'transfer.pdf',
          type: 'application/pdf',
          size: 1024,
        },
      ],
      header: {
        accountingEntityId: accountingEntity.id,
        memo: 'Cash transfer',
        effectiveDate,
        postedAt,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        createdBy: user.id,
      },
      sourceLine: {
        account: sourceAccount,
        sequenceOrder: 1,
        amount: moneyValue.make(10_000n, SYSTEM_CURRENCIES.NGN, true),
        exchangeRate: null,
        description: 'Transfer from bank',
        meta: null,
      },
      destinationLines: [
        {
          account: destinationAccount,
          sequenceOrder: 2,
          amount: moneyValue.make(10_000n, SYSTEM_CURRENCIES.NGN, true),
          exchangeRate: null,
          description: 'Transfer to petty cash',
          meta: null,
        },
      ],
    };

    return { accountingEntity, destinationAccount, payload, sourceAccount };
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
      vatPayableAccount,
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
        description: 'Service revenue',
      }),
      expect.objectContaining({
        accountId: vatPayableAccount.id,
        counterpartyId: taxAuthority.id,
        sequenceOrder: 2,
        side: EJournalSide.Credit,
        description: 'VAT payable',
      }),
      expect.objectContaining({
        accountId: destinationAccount.id,
        counterpartyId: counterparty.id,
        sequenceOrder: 3,
        side: EJournalSide.Debit,
        description: 'Cash received',
      }),
    ]);
    expect(entry.attachments).toEqual(payload.attachments);
    expect(Object.isFrozen(entry.attachments)).toBe(true);
    expect(events.map((event) => event.type)).toEqual([
      EJournalEntryEvent.Created,
      EJournalLineItemEvent.Created,
      EJournalLineItemEvent.Created,
      EJournalLineItemEvent.Created,
    ]);
    expect(audit.header.action).toBe(EJournalEntryAuditAction.Created);
    expect(audit.lines.map((lineAudit) => lineAudit.action)).toEqual([
      EJournalLineAuditAction.Created,
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
    payload.sourceLines[0] = {
      ...payload.sourceLines[0],
      account: payload.destinationLine.account,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidSourceType
    );
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).not.toHaveBeenCalled();
  });

  it('validates every source account against the receipt rule', async () => {
    const { payload } = await makeReceiptFixture();
    payload.sourceLines[1] = {
      ...payload.sourceLines[1],
      account: payload.destinationLine.account,
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
    payload.destinationLine = {
      ...payload.destinationLine,
      account: payload.sourceLines[0].account,
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
    payload.destinationLine = {
      ...payload.destinationLine,
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
    payload.destinationLine = {
      ...payload.destinationLine,
      account: controlAccount,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.ControlAccountNotAllowed
    );
  });

  it('rejects a line whose amount currency does not match its fixed-currency account', async () => {
    const { payload } = await makeReceiptFixture();
    payload.destinationLine = {
      ...payload.destinationLine,
      amount: moneyValue.make(10_000n, SYSTEM_CURRENCIES.USD, true),
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.JournalLineAccountCurrencyMismatch
    );
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).not.toHaveBeenCalled();
  });

  it('rejects a destination amount that does not equal all source amounts', async () => {
    const { payload } = await makeReceiptFixture();
    payload.destinationLine = {
      ...payload.destinationLine,
      amount: moneyValue.make(9_999n, SYSTEM_CURRENCIES.NGN, true),
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.UnbalancedJournalEntry
    );
  });

  it('allows an entry after the account opening balance date', async () => {
    const { payload } = await makeReceiptFixture();
    const openingBalanceDate = new Date('2026-08-01T10:00:00.000Z');
    payload.sourceLines[0] = {
      ...payload.sourceLines[0],
      account: {
        ...payload.sourceLines[0].account,
        openingBalanceDate,
      },
    };
    payload.destinationLine = {
      ...payload.destinationLine,
      account: {
        ...payload.destinationLine.account,
        openingBalanceDate,
      },
    };

    const [entry] = await service.createReceipt(payload, repoOptions);

    expect(entry.effectiveDate).toBe(payload.header.effectiveDate);
  });

  it('allows an entry when account opening balance dates are not set', async () => {
    const { payload } = await makeReceiptFixture();
    payload.sourceLines[0] = {
      ...payload.sourceLines[0],
      account: {
        ...payload.sourceLines[0].account,
        openingBalanceDate: null,
      },
    };
    payload.destinationLine = {
      ...payload.destinationLine,
      account: {
        ...payload.destinationLine.account,
        openingBalanceDate: null,
      },
    };

    const [entry] = await service.createReceipt(payload, repoOptions);

    expect(entry.effectiveDate).toBe(payload.header.effectiveDate);
  });

  it('rejects an entry before the account opening balance date', async () => {
    const { payload } = await makeReceiptFixture();
    const openingBalanceDate = new Date('2026-08-04T09:00:00.000Z');
    payload.sourceLines[0] = {
      ...payload.sourceLines[0],
      account: {
        ...payload.sourceLines[0].account,
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
    payload.sourceLines[0] = {
      ...payload.sourceLines[0],
      counterparty: invalidCounterparty,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidCounterpartyId
    );
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).toHaveBeenCalledTimes(1);
  });

  describe('createPayment', () => {
    it('creates a draft payment with mapped lines, events, and audits', async () => {
      const { payload, sourceAccount, rentAccount, payableAccount } =
        makePaymentFixture();

      const [entry, events, audit] = await service.createPayment(
        payload,
        repoOptions
      );

      expect(entry).toEqual(
        expect.objectContaining({
          accountingEntityId: payload.header.accountingEntityId,
          sourceType: EJournalEntrySourceType.Payment,
          status: EJournalEntryStatus.Draft,
          postedAt: null,
        })
      );
      expect(entry.lines).toEqual([
        expect.objectContaining({
          accountId: sourceAccount.id,
          side: EJournalSide.Credit,
          sequenceOrder: 1,
        }),
        expect.objectContaining({
          accountId: rentAccount.id,
          side: EJournalSide.Debit,
          sequenceOrder: 2,
        }),
        expect.objectContaining({
          accountId: payableAccount.id,
          side: EJournalSide.Debit,
          sequenceOrder: 3,
        }),
      ]);
      expect(entry.attachments).toEqual(payload.attachments);
      expect(events.map((event) => event.type)).toEqual([
        EJournalEntryEvent.Created,
        EJournalLineItemEvent.Created,
        EJournalLineItemEvent.Created,
        EJournalLineItemEvent.Created,
      ]);
      expect(audit.header.action).toBe(EJournalEntryAuditAction.Created);
      expect(audit.lines).toHaveLength(3);
      expect(
        mockAccountingPeriodService.validatePostingPeriod
      ).toHaveBeenCalledWith(
        payload.header.accountingEntityId,
        payload.header.effectiveDate,
        repoOptions
      );
    });

    it('creates a posted payment when a posting date is provided', async () => {
      const { payload } = makePaymentFixture(timestamp);

      const [entry] = await service.createPayment(payload, repoOptions);

      expect(entry.status).toBe(EJournalEntryStatus.Posted);
      expect(entry.postedAt).toBe(timestamp);
    });

    it('rejects a non-permitted source account before period validation', async () => {
      const { payload, rentAccount } = makePaymentFixture();
      payload.sourceLine = { ...payload.sourceLine, account: rentAccount };

      await expect(service.createPayment(payload, repoOptions)).rejects.toThrow(
        journalEntryError.InvalidSourceType
      );
      expect(
        mockAccountingPeriodService.validatePostingPeriod
      ).not.toHaveBeenCalled();
    });

    it('rejects a non-permitted destination account', async () => {
      const { payload, sourceAccount } = makePaymentFixture();
      payload.destinationLines[0] = {
        ...payload.destinationLines[0],
        account: sourceAccount,
      };

      await expect(service.createPayment(payload, repoOptions)).rejects.toThrow(
        journalEntryError.InvalidDestinationAccount
      );
    });

    it('rejects an unbalanced payment', async () => {
      const { payload } = makePaymentFixture();
      payload.destinationLines[0] = {
        ...payload.destinationLines[0],
        amount: moneyValue.make(6_999n, SYSTEM_CURRENCIES.NGN, true),
      };

      await expect(service.createPayment(payload, repoOptions)).rejects.toThrow(
        journalEntryError.UnbalancedJournalEntry
      );
    });
  });

  describe('createTransfer', () => {
    it('creates a draft transfer with mapped lines, attachments, events, and audits', async () => {
      const { destinationAccount, payload, sourceAccount } =
        makeTransferFixture();

      const [entry, events, audit] = await service.createTransfer(
        payload,
        repoOptions
      );

      expect(entry).toEqual(
        expect.objectContaining({
          accountingEntityId: payload.header.accountingEntityId,
          sourceType: EJournalEntrySourceType.Transfer,
          status: EJournalEntryStatus.Draft,
          postedAt: null,
        })
      );
      expect(entry.lines).toEqual([
        expect.objectContaining({
          accountId: sourceAccount.id,
          counterpartyId: null,
          side: EJournalSide.Credit,
          sequenceOrder: 1,
        }),
        expect.objectContaining({
          accountId: destinationAccount.id,
          counterpartyId: null,
          side: EJournalSide.Debit,
          sequenceOrder: 2,
        }),
      ]);
      expect(entry.attachments).toEqual(payload.attachments);
      expect(Object.isFrozen(entry.attachments)).toBe(true);
      expect(events.map((event) => event.type)).toEqual([
        EJournalEntryEvent.Created,
        EJournalLineItemEvent.Created,
        EJournalLineItemEvent.Created,
      ]);
      expect(audit.header.action).toBe(EJournalEntryAuditAction.Created);
      expect(audit.lines).toHaveLength(2);
      expect(
        mockAccountingPeriodService.validatePostingPeriod
      ).toHaveBeenCalledWith(
        payload.header.accountingEntityId,
        payload.header.effectiveDate,
        repoOptions
      );
    });

    it('creates a posted transfer when a posting date is provided', async () => {
      const { payload } = makeTransferFixture(timestamp);

      const [entry] = await service.createTransfer(payload, repoOptions);

      expect(entry.status).toBe(EJournalEntryStatus.Posted);
      expect(entry.postedAt).toBe(timestamp);
    });

    it('creates a balanced cross-currency transfer', async () => {
      const { payload } = makeTransferFixture();
      const exchangeRate = exchangeRateValue.make({
        baseCurrencyCode: SYSTEM_CURRENCIES.USD.code,
        targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        rate: 1600,
        type: EExchangeRateType.Official,
        asOf: effectiveDate,
        source: 'Test Source',
      });
      payload.sourceLine = {
        ...payload.sourceLine,
        amount: moneyValue.make(160_000n, SYSTEM_CURRENCIES.NGN, true),
      };
      payload.destinationLines[0] = {
        ...payload.destinationLines[0],
        account: {
          ...payload.destinationLines[0].account,
          currency: SYSTEM_CURRENCIES.USD,
        },
        amount: moneyValue.make(100n, SYSTEM_CURRENCIES.USD, true),
        exchangeRate,
      };

      const [entry] = await service.createTransfer(payload, repoOptions);

      expect(entry.lines[0].functionalAmount.amount).toBe(160_000n);
      expect(entry.lines[1].functionalAmount.amount).toBe(160_000n);
    });

    it('rejects duplicate transfer accounts before period validation', async () => {
      const { payload } = makeTransferFixture();
      payload.destinationLines[0] = {
        ...payload.destinationLines[0],
        account: payload.sourceLine.account,
      };

      await expect(
        service.createTransfer(payload, repoOptions)
      ).rejects.toThrow(journalEntryError.DuplicateAccountsNotPermitted);
      expect(
        mockAccountingPeriodService.validatePostingPeriod
      ).not.toHaveBeenCalled();
    });

    it('rejects repeated destination accounts before period validation', async () => {
      const { payload } = makeTransferFixture();
      payload.destinationLines.push({
        ...payload.destinationLines[0],
        sequenceOrder: 3,
      });

      await expect(
        service.createTransfer(payload, repoOptions)
      ).rejects.toThrow(journalEntryError.DuplicateAccountsNotPermitted);
      expect(
        mockAccountingPeriodService.validatePostingPeriod
      ).not.toHaveBeenCalled();
    });

    it('rejects a non-cash source account before period validation', async () => {
      const { payload } = makeTransferFixture();
      payload.sourceLine = {
        ...payload.sourceLine,
        account: makePaymentAccount({
          accountingEntityId: payload.header.accountingEntityId,
          behavior: EExpenseAccountBehavior.RentAndUtilities,
          code: '502001',
          subType: EExpenseSubType.RentAndUtilities,
          type: ELedgerType.Expense,
        }),
      };

      await expect(
        service.createTransfer(payload, repoOptions)
      ).rejects.toThrow(journalEntryError.InvalidSourceType);
      expect(
        mockAccountingPeriodService.validatePostingPeriod
      ).not.toHaveBeenCalled();
    });

    it('rejects a non-cash destination account', async () => {
      const { payload } = makeTransferFixture();
      payload.destinationLines[0] = {
        ...payload.destinationLines[0],
        account: makePaymentAccount({
          accountingEntityId: payload.header.accountingEntityId,
          behavior: EExpenseAccountBehavior.RentAndUtilities,
          code: '502001',
          subType: EExpenseSubType.RentAndUtilities,
          type: ELedgerType.Expense,
        }),
      };

      await expect(
        service.createTransfer(payload, repoOptions)
      ).rejects.toThrow(journalEntryError.InvalidDestinationAccount);
    });

    it('rejects an unbalanced transfer', async () => {
      const { payload } = makeTransferFixture();
      payload.destinationLines[0] = {
        ...payload.destinationLines[0],
        amount: moneyValue.make(9_999n, SYSTEM_CURRENCIES.NGN, true),
      };

      await expect(
        service.createTransfer(payload, repoOptions)
      ).rejects.toThrow(journalEntryError.UnbalancedJournalEntry);
    });
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
