import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import { IJournalEntry } from '@domain/journal-entry/types/journal-entry.types';
import {
  EJournalSide,
  IJournalLine,
} from '@domain/journal-entry/types/journal-line.types';
import ledgerAccountBalanceAdjustmentService from '@domain/ledger/services/ledger-account-balance-adjustment.service';
import { EEquitySubType } from '@domain/ledger/types/equity-account.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';

describe('ledgerAccountBalanceAdjustmentService', () => {
  const accountingEntityId = generateUUID();
  const parentId = generateUUID();
  const childOneId = generateUUID();
  const childTwoId = generateUUID();
  const openingBalanceEquityId = generateUUID();

  const account = (
    id: ILedgerAccount['id'],
    materializedPath: string,
    currency: ILedgerAccount['currency'] = SYSTEM_CURRENCIES.NGN,
    subType = 'cash'
  ) =>
    ({
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      id,
      accountingEntityId,
      materializedPath,
      currency,
      subType,
      type: 'asset',
      normalBalance: 'debit',
    }) as ILedgerAccount;

  const parent = account(parentId, '100000');
  const childOne = account(childOneId, '100000.100001', SYSTEM_CURRENCIES.USD);
  const childTwo = account(childTwoId, '100000.100002', SYSTEM_CURRENCIES.USD);
  const openingBalanceEquity = account(
    openingBalanceEquityId,
    '300000',
    SYSTEM_CURRENCIES.NGN,
    EEquitySubType.OpeningBalance
  );

  const line = (
    accountId: ILedgerAccount['id'],
    side: IJournalLine['side'],
    amount: bigint,
    functionalAmount: bigint,
    currency = SYSTEM_CURRENCIES.USD
  ) =>
    ({
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      accountId,
      side,
      amount: { amount, currency },
      functionalAmount: {
        amount: functionalAmount,
        currency: SYSTEM_CURRENCIES.NGN,
      },
    }) as IJournalLine;

  const journal = (lines: IJournalLine[]) =>
    ({
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      id: generateUUID(),
      accountingEntityId,
      lines,
    }) as IJournalEntry;

  it('nets direct lines and aggregates shared ancestor deltas once', () => {
    const result = ledgerAccountBalanceAdjustmentService.calculate(
      journal([
        line(childOneId, EJournalSide.Debit, 100n, 150_000n),
        line(childOneId, EJournalSide.Credit, 20n, 30_000n),
        line(childTwoId, EJournalSide.Credit, 50n, 75_000n),
      ]),
      [parent, childOne, childTwo]
    );

    expect(result).toEqual(
      expect.arrayContaining([
        {
          ledgerAccountId: childOneId,
          amount: { amount: 80n, currency: SYSTEM_CURRENCIES.USD },
          functionalAmount: {
            amount: 120_000n,
            currency: SYSTEM_CURRENCIES.NGN,
          },
        },
        {
          ledgerAccountId: childTwoId,
          amount: { amount: -50n, currency: SYSTEM_CURRENCIES.USD },
          functionalAmount: {
            amount: -75_000n,
            currency: SYSTEM_CURRENCIES.NGN,
          },
        },
        {
          ledgerAccountId: parentId,
          amount: { amount: 45_000n, currency: SYSTEM_CURRENCIES.NGN },
          functionalAmount: {
            amount: 45_000n,
            currency: SYSTEM_CURRENCIES.NGN,
          },
        },
      ])
    );
    expect(result).toHaveLength(3);
  });

  it('uses functional amounts for a null-currency account', () => {
    const nullCurrencyAccount = account(childOneId, '100000.100001', null);

    const result = ledgerAccountBalanceAdjustmentService.calculate(
      journal([line(childOneId, EJournalSide.Debit, 100n, 150_000n)]),
      [parent, nullCurrencyAccount]
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ledgerAccountId: childOneId,
          amount: { amount: 150_000n, currency: SYSTEM_CURRENCIES.NGN },
        }),
      ])
    );
  });

  it('excludes opening-balance equity and its path from propagation', () => {
    const result = ledgerAccountBalanceAdjustmentService.calculate(
      journal([
        line(
          openingBalanceEquityId,
          EJournalSide.Credit,
          100n,
          100n,
          SYSTEM_CURRENCIES.NGN
        ),
      ]),
      [openingBalanceEquity]
    );

    expect(result).toEqual([]);
  });

  it('rejects when a required ancestor is missing', () => {
    expect(() =>
      ledgerAccountBalanceAdjustmentService.calculate(
        journal([line(childOneId, EJournalSide.Debit, 100n, 150_000n)]),
        [childOne]
      )
    ).toThrow();
  });

  it('rejects when a directly referenced account is missing', () => {
    expect(() =>
      ledgerAccountBalanceAdjustmentService.calculate(
        journal([line(childOneId, EJournalSide.Debit, 100n, 150_000n)]),
        [parent]
      )
    ).toThrow();
  });

  it('rejects mismatched journal-line currency for a fixed-currency account', () => {
    expect(() =>
      ledgerAccountBalanceAdjustmentService.calculate(
        journal([
          line(
            childOneId,
            EJournalSide.Debit,
            100n,
            150_000n,
            SYSTEM_CURRENCIES.EUR
          ),
        ]),
        [parent, childOne]
      )
    ).toThrow();
  });
});
