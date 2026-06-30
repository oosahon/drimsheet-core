import { TCreationOmits } from '../../../../../shared/types/creation-omits.types';
import { IMoney } from '../../../../../shared/types/money.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import ledgerAccountBalanceAdjustmentEntityHelpers from '../../../../accounting/entities/helpers/ledger-account-balance-adjustment.entity.helper';
import currencyEntity from '../../../../currency/entities/currency.entity';
import { IJournalLine } from '../../../../journal-entry/types/journal-line.types';
import {
  ELedgerAccountBalanceEffect,
  ILedgerAccountBalanceAdjustment,
  ULedgerAccountBalanceEffect,
} from '../../types/ledger-account-balance.types';
import ledgerAccountBalanceEntity from '../ledger-account-balance.entity';

describe('ledgerAccountBalanceEntity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('make', () => {
    const validPayload: Parameters<typeof ledgerAccountBalanceEntity.make>[0] =
      {
        ledgerAccountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
        accountingEntityId: '923e4567-e89b-12d3-a456-426614174000' as TEntityId,
        accountMaterializedPath: '100000',
        currencyCode: 'NGN',
        functionalCurrencyCode: 'USD',
      };

    it('should create a valid ledger account balance', () => {
      const balance = ledgerAccountBalanceEntity.make(validPayload);

      expect(balance).toEqual({
        ledgerAccountId: validPayload.ledgerAccountId,
        accountingEntityId: validPayload.accountingEntityId,
        accountMaterializedPath: validPayload.accountMaterializedPath,
        amount: expect.objectContaining({
          amount: 0n,
          currency: expect.objectContaining({ code: 'NGN' }),
        }),
        functionalAmount: expect.objectContaining({
          amount: 0n,
          currency: expect.objectContaining({ code: 'USD' }),
        }),
        version: 1,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
      });
      expect(Object.isFrozen(balance)).toBe(true);
    });

    it('should throw if ledgerAccountId is invalid UUID', () => {
      const payload = {
        ...validPayload,
        ledgerAccountId: 'invalid' as unknown as TEntityId,
      };
      expect(() => ledgerAccountBalanceEntity.make(payload)).toThrow();
    });

    it('should throw if accountingEntityId is invalid UUID', () => {
      const payload = {
        ...validPayload,
        accountingEntityId: 'invalid' as unknown as TEntityId,
      };
      expect(() => ledgerAccountBalanceEntity.make(payload)).toThrow();
    });

    it('should throw if accountMaterializedPath is invalid', () => {
      const payload = {
        ...validPayload,
        accountMaterializedPath: '123',
      };
      expect(() => ledgerAccountBalanceEntity.make(payload)).toThrow();
    });

    it('should throw if currencyCode is invalid', () => {
      const payload = {
        ...validPayload,
        currencyCode: 'INVALID',
      };
      expect(() => ledgerAccountBalanceEntity.make(payload)).toThrow();
    });

    it('should throw if functionalCurrencyCode is invalid', () => {
      const payload = {
        ...validPayload,
        functionalCurrencyCode: 'INVALID',
      };
      expect(() => ledgerAccountBalanceEntity.make(payload)).toThrow();
    });
  });

  describe('adjust', () => {
    const validMakePayload: Parameters<
      typeof ledgerAccountBalanceEntity.make
    >[0] = {
      ledgerAccountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
      accountingEntityId: '923e4567-e89b-12d3-a456-426614174000' as TEntityId,
      accountMaterializedPath: '100000',
      currencyCode: 'NGN',
      functionalCurrencyCode: 'USD',
    };

    let existingBalance: ReturnType<typeof ledgerAccountBalanceEntity.make>;

    beforeEach(() => {
      existingBalance = ledgerAccountBalanceEntity.make(validMakePayload);
    });

    const validAdjustmentPayload: TCreationOmits<
      ILedgerAccountBalanceAdjustment,
      'effect'
    > = {
      ledgerAccountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
      amount: { amount: 100n, currency: currencyEntity.getByCode('NGN') },
      functionalAmount: {
        amount: 150n,
        currency: currencyEntity.getByCode('USD'),
      },
      journalEntryId: '223e4567-e89b-12d3-a456-426614174001' as TEntityId,
      createdBy: '423e4567-e89b-12d3-a456-426614174003' as TEntityId,
    };

    it('should create a valid ledger account balance adjustment', () => {
      const data = ledgerAccountBalanceEntity.adjust(
        existingBalance,
        validAdjustmentPayload
      );
      const { adjustment, newBalance } = data;

      expect(adjustment).toEqual({
        id: expect.any(String),
        ledgerAccountId: validAdjustmentPayload.ledgerAccountId,
        amount: validAdjustmentPayload.amount,
        functionalAmount: validAdjustmentPayload.functionalAmount,
        journalEntryId: validAdjustmentPayload.journalEntryId,
        effect: ELedgerAccountBalanceEffect.Increase,
        createdBy: validAdjustmentPayload.createdBy,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      });
      expect(Object.isFrozen(adjustment)).toBe(true);

      expect(newBalance).toEqual({
        ...existingBalance,
        amount: {
          amount: 100n,
          currency: currencyEntity.getByCode('NGN'),
        },
        functionalAmount: {
          amount: 150n,
          currency: currencyEntity.getByCode('USD'),
        },
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
      });
      expect(Object.isFrozen(newBalance)).toBe(true);
    });

    it('should throw if ledgerAccountId is invalid UUID', () => {
      const payload = {
        ...validAdjustmentPayload,
        ledgerAccountId: 'invalid' as unknown as TEntityId,
      };
      expect(() =>
        ledgerAccountBalanceEntity.adjust(existingBalance, payload)
      ).toThrow();
    });

    it('should throw if amount is invalid', () => {
      const payload = {
        ...validAdjustmentPayload,
        amount: {
          amount: 100n,
        } as unknown as typeof validAdjustmentPayload.amount, // Missing currency
      };
      expect(() =>
        ledgerAccountBalanceEntity.adjust(existingBalance, payload)
      ).toThrow();
    });

    it('should throw if functionalAmount is invalid', () => {
      const payload = {
        ...validAdjustmentPayload,
        functionalAmount: {
          amount: 100n,
        } as unknown as typeof validAdjustmentPayload.functionalAmount, // Missing currency
      };
      expect(() =>
        ledgerAccountBalanceEntity.adjust(existingBalance, payload)
      ).toThrow();
    });

    it('should throw if journalEntryId is invalid UUID', () => {
      const payload = {
        ...validAdjustmentPayload,
        journalEntryId: 'invalid' as unknown as TEntityId,
      };
      expect(() =>
        ledgerAccountBalanceEntity.adjust(existingBalance, payload)
      ).toThrow();
    });

    it('should throw if createdBy is invalid UUID', () => {
      const payload = {
        ...validAdjustmentPayload,
        createdBy: 'invalid' as unknown as TEntityId,
      };
      expect(() =>
        ledgerAccountBalanceEntity.adjust(existingBalance, payload)
      ).toThrow();
    });

    it('should throw if amount is not an IMoney object', () => {
      const payload = {
        ...validAdjustmentPayload,
        amount: -100 as unknown as typeof validAdjustmentPayload.amount,
      };
      expect(() =>
        ledgerAccountBalanceEntity.adjust(existingBalance, payload)
      ).toThrow();
    });
  });

  describe('validateEffectType', () => {
    it('should not throw for a valid effect type', () => {
      expect(() =>
        ledgerAccountBalanceEntity.validateEffectType(
          ELedgerAccountBalanceEffect.Increase
        )
      ).not.toThrow();
      expect(() =>
        ledgerAccountBalanceEntity.validateEffectType(
          ELedgerAccountBalanceEffect.Decrease
        )
      ).not.toThrow();
      expect(() =>
        ledgerAccountBalanceEntity.validateEffectType(
          ELedgerAccountBalanceEffect.Noop
        )
      ).not.toThrow();
    });

    it('should throw for an invalid effect type', () => {
      // @ts-expect-error: purposefully testing invalid effect
      const invalidEffect: ULedgerAccountBalanceEffect = 'INVALID';
      expect(() =>
        ledgerAccountBalanceEntity.validateEffectType(invalidEffect)
      ).toThrow();
    });
  });

  describe('getEffectFromAmount', () => {
    it('should throw if amount is invalid', () => {
      // @ts-expect-error: purposefully testing invalid amount
      const invalidAmount: IMoney = { amount: 100n };
      expect(() =>
        ledgerAccountBalanceEntity.getEffectFromAmount(invalidAmount)
      ).toThrow();
    });

    it('should return Noop for zero amount', () => {
      const amount = { amount: 0n, currency: currencyEntity.getByCode('NGN') };
      expect(ledgerAccountBalanceEntity.getEffectFromAmount(amount)).toBe(
        ELedgerAccountBalanceEffect.Noop
      );
    });

    it('should return Increase for positive amount', () => {
      const amount = {
        amount: 100n,
        currency: currencyEntity.getByCode('NGN'),
      };
      expect(ledgerAccountBalanceEntity.getEffectFromAmount(amount)).toBe(
        ELedgerAccountBalanceEffect.Increase
      );
    });

    it('should return Decrease for negative amount', () => {
      const amount = {
        amount: -100n,
        currency: currencyEntity.getByCode('NGN'),
      };
      expect(ledgerAccountBalanceEntity.getEffectFromAmount(amount)).toBe(
        ELedgerAccountBalanceEffect.Decrease
      );
    });
  });

  describe('ledgerAccountBalanceAdjustmentEntityHelpers', () => {
    describe('validateAccountId', () => {
      const makeJournalLine = (
        id: TEntityId,
        accountId: TEntityId
      ): IJournalLine => ({
        id,
        entryId: '423e4567-e89b-12d3-a456-426614174003' as TEntityId,
        accountId,
        sequenceOrder: 1,
        amount: { amount: 100n, currency: currencyEntity.getByCode('NGN') },
        exchangeRate: null,
        functionalAmount: {
          amount: 100n,
          currency: currencyEntity.getByCode('NGN'),
        },
        side: 'debit',
        description: null,
        meta: null,
        version: 1,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
      });

      it('should not throw if all journal lines have the same accountId', () => {
        const accountId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
        const journalLines = [
          makeJournalLine(
            '223e4567-e89b-12d3-a456-426614174001' as TEntityId,
            accountId
          ),
          makeJournalLine(
            '323e4567-e89b-12d3-a456-426614174002' as TEntityId,
            accountId
          ),
        ];
        expect(() =>
          ledgerAccountBalanceAdjustmentEntityHelpers.validateAccountId(
            accountId,
            journalLines
          )
        ).not.toThrow();
      });

      it('should throw if any journal line has a different accountId', () => {
        const accountId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
        const differentAccountId =
          '923e4567-e89b-12d3-a456-426614174000' as TEntityId;
        const journalLines = [
          makeJournalLine(
            '223e4567-e89b-12d3-a456-426614174001' as TEntityId,
            accountId
          ),
          makeJournalLine(
            '323e4567-e89b-12d3-a456-426614174002' as TEntityId,
            differentAccountId
          ),
        ];
        expect(() =>
          ledgerAccountBalanceAdjustmentEntityHelpers.validateAccountId(
            accountId,
            journalLines
          )
        ).toThrow();
      });
    });
  });
});
