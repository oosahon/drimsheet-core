import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TEntityId } from '../../../../shared/types/uuid';
import currencyEntity from '../../../currency/entities/currency.entity';
import {
  ELedgerAccountBalanceEffect,
  ILedgerAccountBalanceAdjustment,
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
        currencyCode: 'NGN',
        functionalCurrencyCode: 'USD',
      };

    it('should create a valid ledger account balance', () => {
      const balance = ledgerAccountBalanceEntity.make(validPayload);

      expect(balance).toEqual({
        ledgerAccountId: validPayload.ledgerAccountId,
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

  describe('makeAdjustment', () => {
    const validAdjustmentPayload: TCreationOmits<ILedgerAccountBalanceAdjustment> =
      {
        ledgerAccountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
        amount: { amount: 100n, currency: currencyEntity.getByCode('NGN') },
        functionalAmount: {
          amount: 150n,
          currency: currencyEntity.getByCode('USD'),
        },
        journalEntryId: '223e4567-e89b-12d3-a456-426614174001' as TEntityId,
        transactionId: '323e4567-e89b-12d3-a456-426614174002' as TEntityId,
        effect: ELedgerAccountBalanceEffect.Increase,
        createdBy: '423e4567-e89b-12d3-a456-426614174003' as TEntityId,
      };

    it('should create a valid ledger account balance adjustment', () => {
      const adjustment = ledgerAccountBalanceEntity.makeAdjustment(
        validAdjustmentPayload
      );

      expect(adjustment).toEqual({
        id: expect.any(String),
        ledgerAccountId: validAdjustmentPayload.ledgerAccountId,
        amount: validAdjustmentPayload.amount,
        functionalAmount: validAdjustmentPayload.functionalAmount,
        journalEntryId: validAdjustmentPayload.journalEntryId,
        transactionId: validAdjustmentPayload.transactionId,
        effect: validAdjustmentPayload.effect,
        createdBy: validAdjustmentPayload.createdBy,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      });
      expect(Object.isFrozen(adjustment)).toBe(true);
    });

    it('should create a valid adjustment with transactionId as null', () => {
      const payload = {
        ...validAdjustmentPayload,
        transactionId: null,
      };
      const adjustment = ledgerAccountBalanceEntity.makeAdjustment(payload);

      expect(adjustment.transactionId).toBeNull();
      expect(Object.isFrozen(adjustment)).toBe(true);
    });

    it('should throw if ledgerAccountId is invalid UUID', () => {
      const payload = {
        ...validAdjustmentPayload,
        ledgerAccountId: 'invalid',
      };
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload as any)
      ).toThrow();
    });

    it('should throw if amount is invalid', () => {
      const payload = {
        ...validAdjustmentPayload,
        amount: { amount: 100 } as any, // Missing currency
      };
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload as any)
      ).toThrow();
    });

    it('should throw if functionalAmount is invalid', () => {
      const payload = {
        ...validAdjustmentPayload,
        functionalAmount: { amount: 100 } as any, // Missing currency
      };
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload as any)
      ).toThrow();
    });

    it('should throw if journalEntryId is invalid UUID', () => {
      const payload = {
        ...validAdjustmentPayload,
        journalEntryId: 'invalid',
      };
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload as any)
      ).toThrow();
    });

    it('should throw if transactionId is invalid UUID (and not null)', () => {
      const payload = {
        ...validAdjustmentPayload,
        transactionId: 'invalid',
      };
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload as any)
      ).toThrow();
    });

    it('should throw if effect is invalid', () => {
      const payload = {
        ...validAdjustmentPayload,
        effect: 'invalid',
      };
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload as any)
      ).toThrow();
    });

    it('should throw if createdBy is invalid UUID', () => {
      const payload = {
        ...validAdjustmentPayload,
        createdBy: 'invalid',
      };
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload as any)
      ).toThrow();
    });

    it('should throw if amount is not an IMoney object', () => {
      const payload = {
        ...validAdjustmentPayload,
        amount: -100,
      };
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload as any)
      ).toThrow();
    });
  });
});
