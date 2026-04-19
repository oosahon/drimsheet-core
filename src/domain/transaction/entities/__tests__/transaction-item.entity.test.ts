import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { USD } from '../../../currency/config/currencies.config';
import { ETransactionType } from '../../types/transaction.types';
import transactionItemEntity from '../transaction-item.entity';

describe('Transaction Item Entity', () => {
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
    const validCategoryId = '1a2b3c4d-5e6f-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId;
    const transactionDate = new Date('2026-04-15T00:00:00.000Z');

    it('should successfully create a transaction item with valid inputs', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalCurrencyAmount: moneyValue.make(50.0, USD, false),
        categoryId: validCategoryId,
        accountId: validAccountId,
      };

      const [item, events] = transactionItemEntity.make(
        validTransactionId,
        ETransactionType.Expense,
        transactionDate,
        payload
      );

      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.description).toBe('Pens');
      expect(item.amount).toEqual(payload.amount);
      expect(item.functionalCurrencyAmount).toEqual(
        payload.functionalCurrencyAmount
      );
      expect(item.transactionId).toBe(validTransactionId);
      expect(item.categoryId).toBe(validCategoryId);
      expect(item.accountId).toBe(validAccountId);
      expect(item.createdAt).toEqual(transactionDate);
      expect(item.updatedAt).toEqual(transactionDate);
      expect(item.deletedAt).toBeNull();
      expect(Object.isFrozen(item)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:transaction:expense:item:created');
      expect(events[0].data).toEqual(item);
    });

    it('should throw an AppError if transactionId is invalid', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalCurrencyAmount: moneyValue.make(50.0, USD, false),
        categoryId: validCategoryId,
        accountId: validAccountId,
      };

      expect(() =>
        transactionItemEntity.make(
          'invalid-uuid' as TEntityId,
          ETransactionType.Expense,
          transactionDate,
          payload
        )
      ).toThrow(AppError);
    });

    it('should throw an AppError if accountId is invalid', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalCurrencyAmount: moneyValue.make(50.0, USD, false),
        categoryId: validCategoryId,
        accountId: 'invalid-uuid' as TEntityId,
      };

      expect(() =>
        transactionItemEntity.make(
          validTransactionId,
          ETransactionType.Expense,
          transactionDate,
          payload
        )
      ).toThrow(AppError);
    });

    it('should throw an AppError if categoryId is invalid', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalCurrencyAmount: moneyValue.make(50.0, USD, false),
        categoryId: 'invalid-uuid' as TEntityId,
        accountId: validAccountId,
      };

      expect(() =>
        transactionItemEntity.make(
          validTransactionId,
          ETransactionType.Expense,
          transactionDate,
          payload
        )
      ).toThrow(AppError);
    });

    it('should throw an AppError if amount is not a valid money object', () => {
      const payload = {
        description: 'Pens',
        amount: { amount: 50, currency: USD } as any,
        functionalCurrencyAmount: moneyValue.make(50.0, USD, false),
        categoryId: validCategoryId,
        accountId: validAccountId,
      };

      expect(() =>
        transactionItemEntity.make(
          validTransactionId,
          ETransactionType.Expense,
          transactionDate,
          payload
        )
      ).toThrow(AppError);
    });

    it('should throw an AppError if functionalCurrencyAmount is not a valid money object', () => {
      const payload = {
        description: 'Pens',
        amount: moneyValue.make(50.0, USD, false),
        functionalCurrencyAmount: { amount: 50, currency: USD } as any,
        categoryId: validCategoryId,
        accountId: validAccountId,
      };

      expect(() =>
        transactionItemEntity.make(
          validTransactionId,
          ETransactionType.Expense,
          transactionDate,
          payload
        )
      ).toThrow(AppError);
    });
  });
});
