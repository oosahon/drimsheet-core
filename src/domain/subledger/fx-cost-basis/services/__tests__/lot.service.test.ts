import generateUUID from '@shared/utils/uuid-generator';

import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  IJournalEntry,
  UJournalEntryStatus,
} from '@domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '@domain/ledger/types/asset-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '@domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import { EExchangeRateType } from '@domain/money/types/exchange-rate.types';
import moneyValue from '@domain/money/values/money.vo';
import fxCostBasisLotEntity from '@domain/subledger/fx-cost-basis/entities/lot.entity';
import fxCostBasisLotError from '@domain/subledger/fx-cost-basis/errors/lot.error';
import IFxCostBasisLotRepo from '@domain/subledger/fx-cost-basis/repos/lot.repo';
import makeFxCostBasisLotService from '@domain/subledger/fx-cost-basis/services/lot.service';
import { EFxCostBasisLotStatus } from '@domain/subledger/fx-cost-basis/types/lot.types';

const mockFxCostBasisLotRepo: jest.Mocked<IFxCostBasisLotRepo> = {
  findOpenByAccountId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

describe('makeFxCostBasisLotService', () => {
  const date = new Date('2026-08-01T00:00:00.000Z');
  const entityId = generateUUID();
  const accountId = generateUUID();
  const userId = generateUUID();
  const rate = {
    currencyPair: 'USD/NGN',
    baseCurrencyCode: 'USD',
    targetCurrencyCode: 'NGN',
    rate: 1500,
    type: EExchangeRateType.Negotiated,
    asOf: date,
    source: 'bank',
    createdAt: date,
  };
  const account: ILedgerAccount = {
    id: accountId,
    version: 1,
    code: '100001',
    materializedPath: '100.100001',
    accountingEntityId: entityId,
    type: ELedgerType.Asset,
    normalBalance: ENormalBalance.Debit,
    subType: EAssetSubType.CashAndCashEquivalent,
    behavior: EAssetAccountBehavior.Bank,
    isControlAccount: false,
    controlAccountId: generateUUID(),
    name: 'USD bank',
    currency: SYSTEM_CURRENCIES.USD,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    meta: null,
    openingBalanceDate: null,
    createdBy: userId,
    createdAt: date,
    updatedAt: date,
    deletedAt: null,
  };

  function makeJournal(
    side: typeof EJournalSide.Debit | typeof EJournalSide.Credit,
    status: UJournalEntryStatus = EJournalEntryStatus.Posted,
    quantity = moneyValue.make(100, SYSTEM_CURRENCIES.USD, false)
  ): IJournalEntry {
    const functionalAmount = moneyValue.convert(
      quantity,
      rate,
      SYSTEM_CURRENCIES.NGN
    );
    const id = generateUUID();
    return {
      id,
      accountingEntityId: entityId,
      sourceType: EJournalEntrySourceType.Payment,
      memo: null,
      status,
      effectiveDate: date,
      postedAt: status === EJournalEntryStatus.Posted ? date : null,
      voidedAt: null,
      voidingEntryId: null,
      version: 1,
      createdBy: userId,
      createdAt: date,
      updatedAt: date,
      attachments: [],
      lines: [
        {
          id: generateUUID(),
          entryId: id,
          accountId,
          counterpartyId: null,
          sequenceOrder: 1,
          amount: quantity,
          exchangeRate: rate,
          functionalAmount,
          side,
          description: null,
          meta: null,
          version: 1,
          createdAt: date,
          updatedAt: date,
        },
      ],
    };
  }

  const service = makeFxCostBasisLotService({
    lotRepo: mockFxCostBasisLotRepo,
  });

  beforeEach(() => jest.clearAllMocks());

  it('derives an acquisition from the completed journal and account', () => {
    const journalEntry = makeJournal(EJournalSide.Debit);
    const officialRate = {
      ...rate,
      type: EExchangeRateType.Official,
    };
    const result = service.acquire({
      journalEntry,
      account,
      officialRate,
    });

    expect(result?.lot[0]).toMatchObject({
      ledgerAccountId: account.id,
      accountingEntityId: entityId,
      originalQuantity: journalEntry.lines[0].amount,
      costBasis: journalEntry.lines[0].functionalAmount,
      acquisitionRate: rate,
      acquisitionDate: date,
    });
    expect(result?.acquisition[0].journalEntryId).toBe(journalEntry.id);
    expect(result?.acquisition[0].officialRate).toBe(officialRate);
  });

  it('permits foreign petty-cash movements for FX cost-basis tracking', () => {
    const pettyCashAccount = {
      ...account,
      behavior: EAssetAccountBehavior.PettyCash,
    } as ILedgerAccount;

    const result = service.acquire({
      journalEntry: makeJournal(EJournalSide.Debit),
      account: pettyCashAccount,
      officialRate: null,
    });

    expect(result).not.toBeNull();
  });

  it.each([
    EJournalEntryStatus.Draft,
    EJournalEntryStatus.Voided,
    EJournalEntryStatus.Archived,
  ])('rejects a direct acquisition for a %s journal', (status) => {
    expect(() =>
      service.acquire({
        journalEntry: makeJournal(EJournalSide.Debit, status),
        account,
        officialRate: null,
      })
    ).toThrow(fxCostBasisLotError.InvalidJournalStatus);
    expect(mockFxCostBasisLotRepo.findOpenByAccountId).not.toHaveBeenCalled();
  });

  it.each([
    EJournalEntryStatus.Draft,
    EJournalEntryStatus.Voided,
    EJournalEntryStatus.Archived,
  ])(
    'rejects a direct disposition for a %s journal before reading lots',
    async (status) => {
      await expect(
        service.dispose(
          {
            journalEntry: makeJournal(EJournalSide.Credit, status),
            account,
            officialRate: null,
          },
          { correlationId: 'corr-id' }
        )
      ).rejects.toBeInstanceOf(fxCostBasisLotError.InvalidJournalStatus);
      expect(mockFxCostBasisLotRepo.findOpenByAccountId).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['functional-currency account', { currency: SYSTEM_CURRENCIES.NGN }],
    ['account without a fixed currency', { currency: null }],
    ['control account', { isControlAccount: true }],
    [
      'non-cash account',
      {
        subType: EAssetSubType.Receivables,
        behavior: null,
      },
    ],
    [
      'cash account with an unsupported behavior',
      { behavior: EAssetAccountBehavior.DefaultCash },
    ],
    [
      'cash account with an unsupported ledger type',
      { type: ELedgerType.Revenue },
    ],
  ])('returns null for a valid %s movement', async (_, accountOverrides) => {
    const candidate = { ...account, ...accountOverrides } as ILedgerAccount;
    const journalEntry = makeJournal(EJournalSide.Credit);
    if (candidate.currency) {
      journalEntry.lines[0] = {
        ...journalEntry.lines[0],
        amount: moneyValue.make(100, candidate.currency, false),
      };
    }

    const result = await service.dispose(
      { journalEntry, account: candidate, officialRate: null },
      { correlationId: 'corr-id' }
    );

    expect(result).toBeNull();
    expect(mockFxCostBasisLotRepo.findOpenByAccountId).not.toHaveBeenCalled();
  });

  it('returns null for a posted functional-currency acquisition candidate', () => {
    const functionalAccount = {
      ...account,
      currency: SYSTEM_CURRENCIES.NGN,
    } as ILedgerAccount;

    const result = service.acquire({
      journalEntry: makeJournal(EJournalSide.Debit),
      account: functionalAccount,
      officialRate: null,
    });

    expect(result).toBeNull();
  });

  it('rejects the wrong journal side for the requested FX operation', () => {
    expect(() =>
      service.acquire({
        journalEntry: makeJournal(EJournalSide.Credit),
        account,
        officialRate: null,
      })
    ).toThrow(fxCostBasisLotError.InvalidJournalSide);
  });

  it.each([
    ['missing', null],
    [
      'wrong currency pair',
      {
        ...rate,
        currencyPair: 'EUR/NGN',
        baseCurrencyCode: 'EUR',
      },
    ],
  ])('rejects a %s transaction rate for an FX movement', (_, exchangeRate) => {
    const journalEntry = makeJournal(EJournalSide.Debit);
    journalEntry.lines[0] = { ...journalEntry.lines[0], exchangeRate };

    expect(() =>
      service.acquire({ journalEntry, account, officialRate: null })
    ).toThrow(fxCostBasisLotError.InvalidTransactionRate);
  });

  it('rejects an official rate for a different currency pair', () => {
    expect(() =>
      service.acquire({
        journalEntry: makeJournal(EJournalSide.Debit),
        account,
        officialRate: {
          ...rate,
          currencyPair: 'EUR/NGN',
          baseCurrencyCode: 'EUR',
          type: EExchangeRateType.Official,
        },
      })
    ).toThrow(fxCostBasisLotError.InvalidOfficialRate);
  });

  it('consumes lots in FIFO order and derives disposition totals', async () => {
    const [firstLot] = fxCostBasisLotEntity.make({
      ledgerAccountId: accountId,
      accountingEntityId: entityId,
      status: EFxCostBasisLotStatus.Open,
      originalQuantity: moneyValue.make(60, SYSTEM_CURRENCIES.USD, false),
      remainingQuantity: moneyValue.make(60, SYSTEM_CURRENCIES.USD, false),
      costBasis: moneyValue.make(84000, SYSTEM_CURRENCIES.NGN, false),
      remainingCostBasis: moneyValue.make(84000, SYSTEM_CURRENCIES.NGN, false),
      acquisitionRate: { ...rate, rate: 1400 },
      acquisitionDate: new Date('2026-07-01T00:00:00.000Z'),
    });
    const [secondLot] = fxCostBasisLotEntity.make({
      ledgerAccountId: accountId,
      accountingEntityId: entityId,
      status: EFxCostBasisLotStatus.Open,
      originalQuantity: moneyValue.make(50, SYSTEM_CURRENCIES.USD, false),
      remainingQuantity: moneyValue.make(50, SYSTEM_CURRENCIES.USD, false),
      costBasis: moneyValue.make(72500, SYSTEM_CURRENCIES.NGN, false),
      remainingCostBasis: moneyValue.make(72500, SYSTEM_CURRENCIES.NGN, false),
      acquisitionRate: { ...rate, rate: 1450 },
      acquisitionDate: new Date('2026-07-15T00:00:00.000Z'),
    });
    mockFxCostBasisLotRepo.findOpenByAccountId.mockResolvedValue([
      firstLot,
      secondLot,
    ]);
    const journalEntry = makeJournal(EJournalSide.Credit);

    const result = await service.dispose(
      { journalEntry, account, officialRate: null },
      { correlationId: 'corr-id' }
    );

    expect(mockFxCostBasisLotRepo.findOpenByAccountId).toHaveBeenCalledWith(
      entityId,
      accountId,
      { correlationId: 'corr-id' }
    );
    expect(result?.lots).toHaveLength(2);
    expect(result?.allocations).toHaveLength(2);
    expect(result?.disposition[0].proceeds).toEqual(
      journalEntry.lines[0].functionalAmount
    );
    expect(result?.lots[0][0].status).toBe(EFxCostBasisLotStatus.Closed);
  });

  it('rejects a disposition when FIFO quantity is insufficient', async () => {
    mockFxCostBasisLotRepo.findOpenByAccountId.mockResolvedValue([]);

    await expect(
      service.dispose(
        {
          journalEntry: makeJournal(EJournalSide.Credit),
          account,
          officialRate: null,
        },
        { correlationId: 'corr-id' }
      )
    ).rejects.toBeInstanceOf(fxCostBasisLotError.InsufficientQuantity);
  });
});
