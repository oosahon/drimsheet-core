import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TEntityId } from '../../../../shared/types/uuid';
import {
  EBalanceEffect,
  ILedgerAccountBalance,
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
    const validPayload: TCreationOmits<ILedgerAccountBalance, 'amount'> = {
      ledgerAccountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
      currencyCode: 'NGN',
      version: 1,
    };

    it('should create a valid ledger account balance', () => {
      const balance = ledgerAccountBalanceEntity.make(validPayload);

      expect(balance).toEqual({
        ledgerAccountId: validPayload.ledgerAccountId,
        currencyCode: validPayload.currencyCode,
        amount: 0,
        version: 1,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
      });
      expect(Object.isFrozen(balance)).toBe(true);
    });

    it('should throw if ledgerAccountId is invalid UUID', () => {
      const payload = {
        ...validPayload,
        ledgerAccountId: 'invalid',
      };
      // @ts-expect-error testing invalid UUID
      expect(() => ledgerAccountBalanceEntity.make(payload)).toThrow();
    });

    it('should throw if currencyCode is invalid', () => {
      const payload = {
        ...validPayload,
        currencyCode: 'INVALID',
      };
      expect(() => ledgerAccountBalanceEntity.make(payload)).toThrow();
    });
  });

  describe('makeAdjustment', () => {
    const validAdjustmentPayload: TCreationOmits<ILedgerAccountBalanceAdjustment> =
      {
        ledgerAccountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
        currencyCode: 'NGN',
        amount: 100,
        journalEntryId: '223e4567-e89b-12d3-a456-426614174001' as TEntityId,
        transactionId: '323e4567-e89b-12d3-a456-426614174002' as TEntityId,
        effect: EBalanceEffect.Increase,
        createdBy: '423e4567-e89b-12d3-a456-426614174003' as TEntityId,
      };

    it('should create a valid ledger account balance adjustment', () => {
      const adjustment = ledgerAccountBalanceEntity.makeAdjustment(
        validAdjustmentPayload
      );

      expect(adjustment).toEqual({
        id: expect.any(String),
        ledgerAccountId: validAdjustmentPayload.ledgerAccountId,
        currencyCode: validAdjustmentPayload.currencyCode,
        amount: validAdjustmentPayload.amount,
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
      // @ts-expect-error testing invalid UUID
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload)
      ).toThrow();
    });

    it('should throw if currencyCode is invalid', () => {
      const payload = {
        ...validAdjustmentPayload,
        currencyCode: 'INVALID',
      };
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload)
      ).toThrow();
    });

    it('should throw if journalEntryId is invalid UUID', () => {
      const payload = {
        ...validAdjustmentPayload,
        journalEntryId: 'invalid',
      };
      // @ts-expect-error testing invalid UUID
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload)
      ).toThrow();
    });

    it('should throw if transactionId is invalid UUID (and not null)', () => {
      const payload = {
        ...validAdjustmentPayload,
        transactionId: 'invalid',
      };
      // @ts-expect-error testing invalid UUID
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload)
      ).toThrow();
    });

    it('should throw if effect is invalid', () => {
      const payload = {
        ...validAdjustmentPayload,
        effect: 'invalid',
      };
      // @ts-expect-error testing invalid effect
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload)
      ).toThrow();
    });

    it('should throw if createdBy is invalid UUID', () => {
      const payload = {
        ...validAdjustmentPayload,
        createdBy: 'invalid',
      };
      // @ts-expect-error testing invalid UUID
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload)
      ).toThrow();
    });

    it('should throw if amount is a negative number', () => {
      const payload = {
        ...validAdjustmentPayload,
        amount: -100,
      };
      expect(() =>
        ledgerAccountBalanceEntity.makeAdjustment(payload)
      ).toThrow();
    });
  });
});
