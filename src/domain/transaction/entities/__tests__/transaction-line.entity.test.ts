import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { USD } from '../../../currency/config/currencies.config';
import { ETransactionType } from '../../types/transaction.types';
import transactionLineEntity from '../transaction-line.entity';

describe('Transaction Line Entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    const validTransactionId =
      '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId;
    const validAccountId = 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId;
    const transactionDate = new Date('2026-04-15T00:00:00.000Z');

    it('should successfully create a transaction item with valid inputs', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalAmount: moneyValue.make(50.0, USD, false),
        targetAccountId: validAccountId,
        counterPartyId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
      };

      const [item, events] = transactionLineEntity.make(
        {
          id: validTransactionId,
          type: ETransactionType.Expense,
          createdAt: transactionDate,
        },
        payload
      );

      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.description).toBe('Pens');
      expect(item.amount).toEqual(payload.amount);
      expect(item.functionalAmount).toEqual(payload.functionalAmount);
      expect(item.transactionId).toBe(validTransactionId);
      expect(item.targetAccountId).toBe(validAccountId);
      expect(item.counterPartyId).toBe(payload.counterPartyId);
      expect(item.createdAt).toEqual(transactionDate);
      expect(item.updatedAt).toEqual(transactionDate);
      expect(item.deletedAt).toBeNull();
      expect(Object.isFrozen(item)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:transaction:line:created');
      expect(events[0].data).toEqual(item);
    });

    it('should throw an AppError if transactionId is invalid', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalAmount: moneyValue.make(50.0, USD, false),
        targetAccountId: validAccountId,
        counterPartyId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
      };

      expect(() =>
        transactionLineEntity.make(
          {
            id: 'invalid-uuid' as TEntityId,
            type: ETransactionType.Expense,
            createdAt: transactionDate,
          },
          payload
        )
      ).toThrow(AppError);
    });

    it('should throw an AppError if accountId is invalid', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalAmount: moneyValue.make(50.0, USD, false),
        targetAccountId: 'invalid-uuid' as TEntityId,
        counterPartyId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
      };

      expect(() =>
        transactionLineEntity.make(
          {
            id: validTransactionId,
            type: ETransactionType.Expense,
            createdAt: transactionDate,
          },
          payload
        )
      ).toThrow(AppError);
    });

    it('should throw an AppError if counterPartyId is invalid', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalAmount: moneyValue.make(50.0, USD, false),
        targetAccountId: validAccountId,
        counterPartyId: 'invalid-uuid' as TEntityId,
      };

      expect(() =>
        transactionLineEntity.make(
          {
            id: validTransactionId,
            type: ETransactionType.Expense,
            createdAt: transactionDate,
          },
          payload
        )
      ).toThrow(AppError);
    });

    it('should throw an AppError if counterPartyId is missing for non-transfer', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalAmount: moneyValue.make(50.0, USD, false),
        targetAccountId: validAccountId,
        counterPartyId: null,
      };

      expect(() =>
        transactionLineEntity.make(
          {
            id: validTransactionId,
            type: ETransactionType.Expense,
            createdAt: transactionDate,
          },
          payload
        )
      ).toThrow(AppError);
    });

    it('should throw an AppError if counterPartyId is provided for a transfer', () => {
      const payload = {
        description: 'Transfer',
        amount: moneyValue.make(50.0, USD, false),
        functionalAmount: moneyValue.make(50.0, USD, false),
        targetAccountId: validAccountId,
        counterPartyId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
      };

      expect(() =>
        transactionLineEntity.make(
          {
            id: validTransactionId,
            type: ETransactionType.Transfer,
            createdAt: transactionDate,
          },
          payload
        )
      ).toThrow(AppError);
    });

    it('should successfully create a transaction item for a transfer without counterPartyId', () => {
      const payload = {
        description: 'Transfer',
        amount: moneyValue.make(50.0, USD, false),
        functionalAmount: moneyValue.make(50.0, USD, false),
        targetAccountId: validAccountId,
        counterPartyId: null,
      };

      const [item, events] = transactionLineEntity.make(
        {
          id: validTransactionId,
          type: ETransactionType.Transfer,
          createdAt: transactionDate,
        },
        payload
      );

      expect(item.counterPartyId).toBeNull();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:transaction:line:created');
    });

    it('should throw an AppError if amount is not a valid money object', () => {
      const payload = {
        description: 'Pens',
        amount: { amount: 50, currency: USD } as unknown as Parameters<
          typeof transactionLineEntity.make
        >[1]['amount'],
        functionalAmount: moneyValue.make(50.0, USD, false),
        targetAccountId: validAccountId,
        counterPartyId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
      };

      expect(() =>
        transactionLineEntity.make(
          {
            id: validTransactionId,
            type: ETransactionType.Expense,
            createdAt: transactionDate,
          },
          payload
        )
      ).toThrow(AppError);
    });

    it('should throw an AppError if functionalAmount is not a valid money object', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalAmount: {
          amount: 50,
          currency: USD,
        } as unknown as Parameters<
          typeof transactionLineEntity.make
        >[1]['functionalAmount'],
        targetAccountId: validAccountId,
        counterPartyId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
      };

      expect(() =>
        transactionLineEntity.make(
          {
            id: validTransactionId,
            type: ETransactionType.Expense,
            createdAt: transactionDate,
          },
          payload
        )
      ).toThrow(AppError);
    });
  });
});
