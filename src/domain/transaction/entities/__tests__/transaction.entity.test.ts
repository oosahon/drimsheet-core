import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { EUR, USD } from '../../../currency/config/currencies.config';
import { ETransactionEvent } from '../../events/transaction.events';
import {
  ETransactionStatus,
  ETransactionType,
  UTransactionStatus,
  UTransactionType,
} from '../../types/transaction.types';
import { TMakeTransactionItemPayload } from '../transaction-item.entity';
import transactionEntity from '../transaction.entity';

type TMakeTransactionPayload = Parameters<typeof transactionEntity.make>[0];

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
    let validPayload: TMakeTransactionPayload;
    let validItems: TMakeTransactionItemPayload[];

    beforeEach(() => {
      validPayload = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        reference: 'TRX-001',
        type: ETransactionType.Expense,
        status: ETransactionStatus.Pending,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        createdBy: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceAccountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        exchangeRate: 1,
        attachments: [
          {
            url: 'https://example.com/receipt.pdf',
            name: 'receipt.pdf',
            type: 'application/pdf',
            size: 1024,
          },
        ],
        counterPartyId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
        notes: 'Office supplies',
        functionalCurrency: USD,
      };

      validItems = [
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
      ];
    });

    it('should successfully create a transaction with valid inputs', () => {
      const [transaction, events] = transactionEntity.make(
        validPayload,
        validItems
      );

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe(ETransactionEvent.Created);
      expect(events[0].data).toEqual(transaction);

      expect(typeof transaction.id).toBe('string');
      expect(transaction.id.length).toBeGreaterThan(0);
      expect(transaction.items).toHaveLength(2);
      expect(typeof transaction.items[0].id).toBe('string');
      expect(transaction.items[0].transactionId).toBe(transaction.id);
      expect(transaction.version).toBe(1);
      expect(transaction.createdAt).toEqual(
        new Date('2026-04-15T00:00:00.000Z')
      );
      expect(transaction.amount.amount).toBe(10050n);
      expect(transaction.functionalCurrencyAmount.amount).toBe(10050n);
      expect(Object.isFrozen(transaction)).toBe(true);
      expect(Object.isFrozen(transaction.items[0])).toBe(true);
      expect(transaction.notes).toBe('Office supplies');
    });

    it('should assign a generated reference if one is not provided', () => {
      const { reference, ...payloadWithoutRef } = validPayload;

      const [transaction] = transactionEntity.make(
        payloadWithoutRef as TMakeTransactionPayload,
        validItems
      );
      expect(transaction.reference).toBeDefined();
      expect(transaction.reference).toMatch(/^REF-[A-Z]{3}-\d+$/);
    });

    it('should allow omitting notes and assign null', () => {
      const payloadWithoutNotes: TMakeTransactionPayload = {
        ...validPayload,
        notes: null,
      };

      const [transaction] = transactionEntity.make(
        payloadWithoutNotes,
        validItems
      );
      expect(transaction.notes).toBeNull();
    });

    it('should throw an AppError if items array is empty', () => {
      expect(() => transactionEntity.make(validPayload, [])).toThrow(AppError);
    });

    it('should throw an AppError if items have different currencies', () => {
      validItems.push({
        description: 'Eraser',
        amount: moneyValue.make(50.0, EUR, false),
        functionalCurrencyAmount: moneyValue.make(50.0, EUR, false),
        categoryId: '1a2b3c4d-5e6f-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
        accountId: '5a6b7c8d-9e0f-4a2b-8c4d-5e6f7a8b9c0d' as TEntityId,
      });
      expect(() => transactionEntity.make(validPayload, validItems)).toThrow(
        AppError
      );
    });
  });

  describe('Helpers', () => {
    describe('generateReference', () => {
      it('generates a reference matching the expected pattern', () => {
        const ref = transactionEntity.generateReference();
        expect(ref).toMatch(/^REF-[A-Z]{3}-\d+$/);
      });
    });

    describe('validateReference', () => {
      it('should validate a valid reference', () => {
        expect(() =>
          transactionEntity.validateReference('REF-123')
        ).not.toThrow();
      });

      it('should throw for an invalid reference', () => {
        expect(() => transactionEntity.validateReference('')).toThrow(AppError);
        expect(() => transactionEntity.validateReference('   ')).toThrow();
      });
    });

    describe('validateType', () => {
      it('should validate a valid type', () => {
        expect(() =>
          transactionEntity.validateType(ETransactionType.Expense)
        ).not.toThrow();
      });

      it('should throw for an invalid type', () => {
        const invalidType = 'invalid' as unknown as UTransactionType;
        expect(() => transactionEntity.validateType(invalidType)).toThrow(
          AppError
        );
      });
    });

    describe('validateStatus', () => {
      it('should validate a valid status', () => {
        expect(() =>
          transactionEntity.validateStatus(ETransactionStatus.Pending)
        ).not.toThrow();
      });

      it('should throw for an invalid status', () => {
        const invalidStatus = 'invalid' as unknown as UTransactionStatus;
        expect(() => transactionEntity.validateStatus(invalidStatus)).toThrow(
          AppError
        );
      });
    });

    describe('validateAttachment', () => {
      it('should validate a valid attachment', () => {
        expect(() =>
          transactionEntity.validateAttachment({
            url: 'https://example.com/file',
            name: 'file.pdf',
            type: 'application/pdf',
            size: 100,
          })
        ).not.toThrow();
      });

      it('should throw if url is invalid', () => {
        expect(() =>
          transactionEntity.validateAttachment({
            url: 'invalid-url',
            name: 'file.pdf',
            type: 'application/pdf',
            size: 100,
          })
        ).toThrow(AppError);
      });

      it('should throw if name is empty', () => {
        expect(() =>
          transactionEntity.validateAttachment({
            url: 'https://example.com/file',
            name: '',
            type: 'application/pdf',
            size: 100,
          })
        ).toThrow(AppError);
      });

      it('should throw if type is empty', () => {
        expect(() =>
          transactionEntity.validateAttachment({
            url: 'https://example.com/file',
            name: 'file.pdf',
            type: '',
            size: 100,
          })
        ).toThrow(AppError);
      });

      it('should throw if size is invalid or less than or equal to 0', () => {
        expect(() =>
          transactionEntity.validateAttachment({
            url: 'https://example.com/file',
            name: 'file.pdf',
            type: 'application/pdf',
            size: 0,
          })
        ).toThrow(AppError);

        const invalidSize = '100' as unknown as number;
        expect(() =>
          transactionEntity.validateAttachment({
            url: 'https://example.com/file',
            name: 'file.pdf',
            type: 'application/pdf',
            size: invalidSize,
          })
        ).toThrow(AppError);
      });
    });

    describe('validateAttachments', () => {
      it('should throw if not an array', () => {
        const invalidAttachments = {} as unknown as Parameters<
          typeof transactionEntity.validateAttachments
        >[0];
        expect(() =>
          transactionEntity.validateAttachments(invalidAttachments)
        ).toThrow(AppError);
      });

      it('should throw if array contains invalid attachment', () => {
        expect(() =>
          transactionEntity.validateAttachments([
            {
              url: 'invalid-url',
              name: 'file.pdf',
              type: 'application/pdf',
              size: 100,
            },
          ])
        ).toThrow(AppError);
      });
    });

    describe('validateCounterpartyId', () => {
      it('should not throw if type is Transfer and counterPartyId is null', () => {
        expect(() =>
          transactionEntity.validateCounterpartyId(
            ETransactionType.Transfer,
            null
          )
        ).not.toThrow();
      });

      it('should throw if counterPartyId is missing for non-transfers', () => {
        expect(() =>
          transactionEntity.validateCounterpartyId(
            ETransactionType.Expense,
            null
          )
        ).toThrow(AppError);
      });

      it('should validate typical valid uuid counterPartyId', () => {
        expect(() =>
          transactionEntity.validateCounterpartyId(
            ETransactionType.Expense,
            '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId
          )
        ).not.toThrow();
      });

      it('should throw if counterPartyId is an invalid uuid', () => {
        expect(() =>
          transactionEntity.validateCounterpartyId(
            ETransactionType.Expense,
            'invalid-uuid' as TEntityId
          )
        ).toThrow(AppError);
      });
    });

    describe('sanitizeAndValidateNotes', () => {
      it('should return null for undefined or null or empty', () => {
        expect(transactionEntity.sanitizeAndValidateNotes(null)).toBeNull();
        expect(
          transactionEntity.sanitizeAndValidateNotes(undefined)
        ).toBeNull();
        expect(transactionEntity.sanitizeAndValidateNotes('')).toBeNull();
      });

      it('should return trimmed notes', () => {
        const result = transactionEntity.sanitizeAndValidateNotes('  abc  ');
        expect(result).toBe('abc');
      });

      it('should throw if notes are out of bounds (e.g. >100 characters)', () => {
        const longStr = 'a'.repeat(101);
        expect(() =>
          transactionEntity.sanitizeAndValidateNotes(longStr)
        ).toThrow(AppError);
      });

      it('should throw if notes is not a string', () => {
        const unknownNotes = 123 as unknown as string;
        expect(() =>
          transactionEntity.sanitizeAndValidateNotes(unknownNotes)
        ).toThrow(AppError);
      });
    });
  });
});
