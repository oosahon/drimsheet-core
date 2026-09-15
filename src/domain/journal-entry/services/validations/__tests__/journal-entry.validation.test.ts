import { TEntityId } from '@shared/types/uuid';

import { ICounterparty } from '@domain/counterparty/types/counterparty.types';
import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import journalEntryServiceValidation from '@domain/journal-entry/services/validations/journal-entry.validation';
import { ICreateReceiptEntryPayload } from '@domain/journal-entry/types/journal-entry.service.types';
import ledgerAccountBalanceEntity from '@domain/ledger/entities/ledger-account-balance.entity';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import moneyValue from '@domain/money/values/money.vo';

describe('journalEntryServiceValidation', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(journalEntryServiceValidation)).toBe(true);
  });

  const accountingEntityId =
    '4b4c1064-a09e-4e4f-b6a3-23945cc87f74' as TEntityId;
  const sourceAccountId = '5b4c1064-a09e-4e4f-b6a3-23945cc87f75' as TEntityId;

  function makeSourceAccountBalance(amount: bigint) {
    const balance = ledgerAccountBalanceEntity.make({
      ledgerAccountId: sourceAccountId,
      accountingEntityId,
      accountMaterializedPath: '100001',
      currencyCode: SYSTEM_CURRENCIES.NGN.code,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
    });

    return ledgerAccountBalanceEntity.adjust(balance, {
      ledgerAccountId: sourceAccountId,
      amount: moneyValue.make(amount, SYSTEM_CURRENCIES.NGN, true),
      functionalAmount: moneyValue.make(amount, SYSTEM_CURRENCIES.NGN, true),
      journalEntryId: '6b4c1064-a09e-4e4f-b6a3-23945cc87f76' as TEntityId,
      createdBy: '7b4c1064-a09e-4e4f-b6a3-23945cc87f77' as TEntityId,
    }).newBalance;
  }

  function makePayload(
    sourceCounterparties: (ICounterparty | null)[],
    destinationCounterparty: ICounterparty | null
  ): ICreateReceiptEntryPayload {
    return {
      attachments: [],
      header: {
        accountingEntityId,
        memo: null,
        effectiveDate: new Date('2026-08-03T10:00:00.000Z'),
        postedAt: null,
        functionalCurrencyCode: 'NGN',
        createdBy: accountingEntityId,
      },
      sourceLines: sourceCounterparties.map((counterparty) => ({
        counterparty,
      })) as unknown as ICreateReceiptEntryPayload['sourceLines'],
      destinationLine: {
        counterparty: destinationCounterparty,
      } as unknown as ICreateReceiptEntryPayload['destinationLine'],
    };
  }

  describe('validateCounterparties', () => {
    it('succeeds when all counterparties belong to the accounting entity', () => {
      const counterparty = {
        accountingEntityId,
      } as ICounterparty;
      const payload = makePayload([counterparty, counterparty], counterparty);

      expect(() =>
        journalEntryServiceValidation.validateCounterparties(payload.header, [
          ...payload.sourceLines,
          payload.destinationLine,
        ])
      ).not.toThrow();
    });

    it('succeeds when every line has no counterparty', () => {
      const payload = makePayload([null, null], null);

      expect(() =>
        journalEntryServiceValidation.validateCounterparties(payload.header, [
          ...payload.sourceLines,
          payload.destinationLine,
        ])
      ).not.toThrow();
    });

    it('throws when a line counterparty does not belong to the accounting entity', () => {
      const invalidCounterparty = {
        accountingEntityId: 'different-entity-id' as TEntityId,
      } as ICounterparty;
      const payload = makePayload([null, invalidCounterparty], null);

      expect(() =>
        journalEntryServiceValidation.validateCounterparties(payload.header, [
          ...payload.sourceLines,
          payload.destinationLine,
        ])
      ).toThrow(journalEntryError.InvalidCounterpartyId);
    });

    it('throws when the destination counterparty does not belong to the accounting entity', () => {
      const invalidCounterparty = {
        accountingEntityId: 'different-entity-id' as TEntityId,
      } as ICounterparty;
      const payload = makePayload([null], invalidCounterparty);

      expect(() =>
        journalEntryServiceValidation.validateCounterparties(payload.header, [
          ...payload.sourceLines,
          payload.destinationLine,
        ])
      ).toThrow(journalEntryError.InvalidCounterpartyId);
    });
  });

  describe('validateSourceAccountBalance', () => {
    it('throws when the source account balance is missing', () => {
      const sourceAmount = moneyValue.make(
        10_000n,
        SYSTEM_CURRENCIES.NGN,
        true
      );

      expect(() =>
        journalEntryServiceValidation.validateSourceAccountBalance(
          sourceAccountId,
          sourceAmount,
          null
        )
      ).toThrow(journalEntryError.MissingSourceAccountBalance);
    });

    it('throws when the source amount is greater than the balance', () => {
      const sourceAmount = moneyValue.make(
        10_001n,
        SYSTEM_CURRENCIES.NGN,
        true
      );
      const sourceAccountBalance = makeSourceAccountBalance(10_000n);

      expect(() =>
        journalEntryServiceValidation.validateSourceAccountBalance(
          sourceAccountId,
          sourceAmount,
          sourceAccountBalance
        )
      ).toThrow(journalEntryError.InsufficientSourceAccountBalance);
    });

    it.each<[string, bigint]>([
      ['equal to', 10_000n],
      ['less than', 9_999n],
    ])('succeeds when the source amount is %s the balance', (_, amount) => {
      const sourceAmount = moneyValue.make(amount, SYSTEM_CURRENCIES.NGN, true);
      const sourceAccountBalance = makeSourceAccountBalance(10_000n);

      expect(() =>
        journalEntryServiceValidation.validateSourceAccountBalance(
          sourceAccountId,
          sourceAmount,
          sourceAccountBalance
        )
      ).not.toThrow();
    });
  });
});
