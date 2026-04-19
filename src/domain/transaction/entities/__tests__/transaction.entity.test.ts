import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { EUR, USD } from '../../../currency/config/currencies.config';
import { ETransactionEvent } from '../../events/transaction.events';
import {
  ETransactionHistoryLogAction,
  ETransactionStatus,
  ETransactionType,
  ITransaction,
} from '../../types/transaction.types';
import transactionEntity, {
  TMakeTransactionPayload,
} from '../transaction.entity';

describe('Transaction Entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    it('should successfully create a transaction with valid inputs', () => {
      const payload: TMakeTransactionPayload = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        reference: 'TRX-001',
        type: ETransactionType.Expense,
        status: ETransactionStatus.Pending,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        createdBy: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceAccountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        amount: moneyValue.make(100.5, USD, false),
        functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
        exchangeRate: 1,
        attachments: [],
        counterPartyId: null,
        notes: null,
        items: [
          {
            description: 'Pens',
            amount: moneyValue.make(50.0, USD, false),
            functionalCurrencyAmount: moneyValue.make(50.0, USD, false),
            categoryId: '1a2b3c4d-5e6f-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
            accountId: '5a6b7c8d-9e0f-4a2b-8c4d-5e6f7a8b9c0d' as TEntityId,
          },
          {
            description: 'Paper',
            amount: moneyValue.make(50.5, USD, false),
            functionalCurrencyAmount: moneyValue.make(50.5, USD, false),
            categoryId: '2b3c4d5e-6f7a-4b9c-8d1e-2f3a4b5c6d7e' as TEntityId,
            accountId: '6b7c8d9e-0f1a-4b3c-8d5e-6f7a8b9c0d1e' as TEntityId,
          },
        ],
      };

      const [transaction, events] = transactionEntity.make(payload);

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe(ETransactionEvent.TransactionCreated);
      expect(events[0].data).toEqual(transaction);
      expect(events[1].type).toBe('domain:transaction:expense:item:created');
      expect(events[2].type).toBe('domain:transaction:expense:item:created');

      expect(typeof transaction.id).toBe('string');
      expect(transaction.id.length).toBeGreaterThan(0);
      expect(transaction.items).toHaveLength(2);
      expect(typeof transaction.items[0].id).toBe('string');
      expect(transaction.items[0].transactionId).toBe(transaction.id);
      expect(transaction.version).toBe(1);
      expect(transaction.createdAt).toEqual(
        new Date('2026-04-15T00:00:00.000Z')
      );
      expect(Object.isFrozen(transaction)).toBe(true);
      expect(Object.isFrozen(transaction.items[0])).toBe(true);
    });

    it('should throw an AppError if items array is empty', () => {
      const payload: TMakeTransactionPayload = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        reference: 'TRX-001',
        type: ETransactionType.Expense,
        status: ETransactionStatus.Pending,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        createdBy: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceAccountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        amount: moneyValue.make(100.5, USD, false),
        functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
        exchangeRate: 1,
        attachments: [],
        counterPartyId: null,
        notes: 'Office supplies',
        items: [],
      };

      expect(() => transactionEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if sum of items does not match amount', () => {
      const payload: TMakeTransactionPayload = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        reference: 'TRX-001',
        type: ETransactionType.Expense,
        status: ETransactionStatus.Pending,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        createdBy: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceAccountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        amount: moneyValue.make(100.5, USD, false), // 100.50
        functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
        exchangeRate: 1,
        attachments: [],
        counterPartyId: null,
        notes: 'Office supplies',
        items: [
          {
            description: 'Pens',
            amount: moneyValue.make(40.0, USD, false), // 40
            functionalCurrencyAmount: moneyValue.make(40.0, USD, false),
            categoryId: '1a2b3c4d-5e6f-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
            accountId: '5a6b7c8d-9e0f-4a2b-8c4d-5e6f7a8b9c0d' as TEntityId,
          },
        ],
      };

      expect(() => transactionEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if counterPartyId is an invalid uuid', () => {
      const payload: TMakeTransactionPayload = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        reference: 'TRX-001',
        type: ETransactionType.Expense,
        status: ETransactionStatus.Pending,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        createdBy: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceAccountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        amount: moneyValue.make(100.5, USD, false),
        functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
        exchangeRate: 1,
        attachments: [],
        counterPartyId: 'invalid-uuid' as TEntityId,
        notes: 'Office supplies',
        items: [
          {
            description: 'Pens',
            amount: moneyValue.make(100.5, USD, false),
            functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
            categoryId: '1a2b3c4d-5e6f-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
            accountId: '5a6b7c8d-9e0f-4a2b-8c4d-5e6f7a8b9c0d' as TEntityId,
          },
        ],
      };

      expect(() => transactionEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if an item does not have the same currency as the transaction amount', () => {
      const payload: TMakeTransactionPayload = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        reference: 'TRX-001',
        type: ETransactionType.Expense,
        status: ETransactionStatus.Pending,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        createdBy: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceAccountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        amount: moneyValue.make(100.5, USD, false),
        functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
        exchangeRate: 1,
        attachments: [],
        counterPartyId: null,
        notes: 'Office supplies',
        items: [
          {
            description: 'Pens',
            amount: moneyValue.make(100.5, EUR, false),
            functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
            categoryId: '1a2b3c4d-5e6f-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
            accountId: '5a6b7c8d-9e0f-4a2b-8c4d-5e6f7a8b9c0d' as TEntityId,
          },
        ],
      };

      expect(() => transactionEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if an item functional currency does not match transaction functional currency', () => {
      const payload: TMakeTransactionPayload = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        reference: 'TRX-001',
        type: ETransactionType.Expense,
        status: ETransactionStatus.Pending,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        createdBy: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceAccountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        amount: moneyValue.make(100.5, USD, false),
        functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
        exchangeRate: 1,
        attachments: [],
        counterPartyId: null,
        notes: 'Office supplies',
        items: [
          {
            description: 'Pens',
            amount: moneyValue.make(100.5, USD, false),
            functionalCurrencyAmount: moneyValue.make(100.5, EUR, false),
            categoryId: '1a2b3c4d-5e6f-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
            accountId: '5a6b7c8d-9e0f-4a2b-8c4d-5e6f7a8b9c0d' as TEntityId,
          },
        ],
      };

      expect(() => transactionEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if sum of items functional amounts does not match transaction functional amount', () => {
      const payload: TMakeTransactionPayload = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        reference: 'TRX-001',
        type: ETransactionType.Expense,
        status: ETransactionStatus.Pending,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        createdBy: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceAccountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        amount: moneyValue.make(100.5, USD, false),
        functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
        exchangeRate: 1,
        attachments: [],
        counterPartyId: null,
        notes: 'Office supplies',
        items: [
          {
            description: 'Pens',
            amount: moneyValue.make(100.5, USD, false),
            functionalCurrencyAmount: moneyValue.make(80.5, USD, false), // 80.50 != 100.50
            categoryId: '1a2b3c4d-5e6f-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
            accountId: '5a6b7c8d-9e0f-4a2b-8c4d-5e6f7a8b9c0d' as TEntityId,
          },
        ],
      };

      expect(() => transactionEntity.make(payload)).toThrow(AppError);
    });
  });

  describe('update', () => {
    let baseTransaction: ITransaction;

    beforeEach(() => {
      [baseTransaction] = transactionEntity.make({
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        reference: 'TRX-001',
        type: ETransactionType.Expense,
        status: ETransactionStatus.Pending,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        createdBy: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceAccountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        amount: moneyValue.make(100.5, USD, false),
        functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
        exchangeRate: 1,
        attachments: [],
        counterPartyId: null,
        notes: 'Office supplies',
        items: [
          {
            description: 'Pens',
            amount: moneyValue.make(100.5, USD, false),
            functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
            categoryId: '1a2b3c4d-5e6f-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
            accountId: '5a6b7c8d-9e0f-4a2b-8c4d-5e6f7a8b9c0d' as TEntityId,
          },
        ],
      });

      jest.setSystemTime(new Date('2026-04-16T00:00:00.000Z'));
    });

    it('should successfully update relevant fields and bump version', () => {
      const newDate = new Date('2026-05-01T00:00:00.000Z');
      const [updatedTransaction, events] = transactionEntity.update(
        baseTransaction,
        {
          reference: 'TRX-001-Updated',
          status: ETransactionStatus.Posted,
          effectiveDate: newDate,
          notes: 'Updated notes',
        }
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ETransactionEvent.TransactionUpdated);
      expect(events[0].data).toEqual(updatedTransaction);

      expect(updatedTransaction.reference).toBe('TRX-001-Updated');
      expect(updatedTransaction.status).toBe(ETransactionStatus.Posted);
      expect(updatedTransaction.effectiveDate).toEqual(newDate);
      expect(updatedTransaction.notes).toBe('Updated notes');
      expect(updatedTransaction.version).toBe(2);
      expect(updatedTransaction.updatedAt).toEqual(
        new Date('2026-04-16T00:00:00.000Z')
      );
      expect(Object.isFrozen(updatedTransaction)).toBe(true);
    });

    it('should return the original transaction with no events if no changes are made', () => {
      const [updatedTransaction, events] = transactionEntity.update(
        baseTransaction,
        {
          reference: 'TRX-001',
          status: ETransactionStatus.Pending,
          effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
          notes: 'Office supplies',
          counterPartyId: null,
        }
      );

      expect(events).toHaveLength(0);
      expect(updatedTransaction).toEqual(baseTransaction);
    });

    it('should successfully update when some fields are omitted', () => {
      const newDate = new Date('2026-06-01T00:00:00.000Z');
      const [updatedTransaction, events] = transactionEntity.update(
        baseTransaction,
        {
          effectiveDate: newDate,
        }
      );

      expect(events).toHaveLength(1);
      expect(updatedTransaction.effectiveDate).toEqual(newDate);
      expect(updatedTransaction.notes).toBe('Office supplies');
      expect(updatedTransaction.counterPartyId).toBeNull();
      expect(updatedTransaction.version).toBe(2);
    });

    it('should successfully update partial fields', () => {
      const [updatedTransaction, events] = transactionEntity.update(
        baseTransaction,
        {
          notes: 'Partial update notes',
          counterPartyId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
        }
      );

      expect(events).toHaveLength(1);
      expect(updatedTransaction.notes).toBe('Partial update notes');
      expect(updatedTransaction.counterPartyId).toBe(
        '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d'
      );
      expect(updatedTransaction.reference).toBe('TRX-001');
      expect(updatedTransaction.version).toBe(2);
    });
  });

  describe('makeHistoryLog', () => {
    let mockCurrentTransaction: ITransaction;

    beforeEach(() => {
      [mockCurrentTransaction] = transactionEntity.make({
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        reference: 'TRX-001',
        type: ETransactionType.Expense,
        status: ETransactionStatus.Pending,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        createdBy: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceAccountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        amount: moneyValue.make(100.5, USD, false),
        functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
        exchangeRate: 1,
        attachments: [],
        counterPartyId: null,
        notes: 'Office supplies',
        items: [
          {
            description: 'Pens',
            amount: moneyValue.make(100.5, USD, false),
            functionalCurrencyAmount: moneyValue.make(100.5, USD, false),
            categoryId: '1a2b3c4d-5e6f-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
            accountId: '5a6b7c8d-9e0f-4a2b-8c4d-5e6f7a8b9c0d' as TEntityId,
          },
        ],
      });
    });

    it('should successfully create a history log', () => {
      const payload = {
        current: mockCurrentTransaction,
        previous: null,
        userId: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        action: ETransactionHistoryLogAction.Created,
        note: 'Initial creation',
      };

      const log = transactionEntity.makeHistoryLog(payload);

      expect(log.transactionId).toBe(mockCurrentTransaction.id);
      expect(log.userId).toBe('4d8e10ab-5c31-419b-ab29-688001d9f8e4');
      expect(log.action).toBe(ETransactionHistoryLogAction.Created);
      expect(log.note).toBe('Initial creation');
      expect(log.diff).toBeDefined();
      expect(log.createdAt).toEqual(new Date('2026-04-15T00:00:00.000Z'));
      expect(Object.isFrozen(log)).toBe(true);
    });

    it('should successfully create a history log without note', () => {
      const payload = {
        current: mockCurrentTransaction,
        previous: null,
        userId: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        action: ETransactionHistoryLogAction.Created,
      };

      const log = transactionEntity.makeHistoryLog(payload);

      expect(log.transactionId).toBe(mockCurrentTransaction.id);
      expect(log.userId).toBe('4d8e10ab-5c31-419b-ab29-688001d9f8e4');
      expect(log.action).toBe(ETransactionHistoryLogAction.Created);
      expect(log.note).toBeUndefined();
      expect(log.diff).toBeDefined();
      expect(log.createdAt).toEqual(new Date('2026-04-15T00:00:00.000Z'));
      expect(Object.isFrozen(log)).toBe(true);
    });
  });
});
