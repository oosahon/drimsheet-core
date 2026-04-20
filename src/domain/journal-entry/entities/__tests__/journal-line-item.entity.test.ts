import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { EUR, USD } from '../../../currency/config/currencies.config';
import { EJournalLineItemEvent } from '../../events/journal-line-item.events';
import {
  EEJournalEntrySide,
  UJournalEntrySide,
} from '../../types/journal-entry.types';
import journalLineItemEntity from '../journal-line-item.entity';

type TMakePayload = Parameters<typeof journalLineItemEntity.make>[1];
type TEntryPayload = Parameters<typeof journalLineItemEntity.make>[0];

describe('JournalLineItem Entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    let validEntryPayload: TEntryPayload;
    let validPayload: TMakePayload;

    beforeEach(() => {
      validEntryPayload = {
        id: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        memo: 'General Memo',
        createdAt: new Date('2026-04-15T00:00:00.000Z'),
      };

      validPayload = {
        accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        sequenceOrder: 1,
        amount: moneyValue.make(100.0, EUR, false),
        exchangeRate: 1.1,
        side: EEJournalEntrySide.Debit,
        description: 'Line item description',
      };
    });

    it('should successfully create a journal line item with valid inputs', () => {
      const [lineItem, events] = journalLineItemEntity.make(
        validEntryPayload,
        validPayload,
        USD
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(EJournalLineItemEvent.Created);
      expect(events[0].data).toEqual(lineItem);

      expect(typeof lineItem.id).toBe('string');
      expect(lineItem.id.length).toBeGreaterThan(0);
      expect(lineItem.entryId).toBe(validEntryPayload.id);
      expect(lineItem.accountId).toBe(validPayload.accountId);
      expect(lineItem.sequenceOrder).toBe(1);
      expect(lineItem.amount.currency).toEqual(EUR);
      expect(lineItem.exchangeRate).toBe(1.1);

      expect(lineItem.functionalAmount.currency).toEqual(USD);

      expect(lineItem.side).toBe(EEJournalEntrySide.Debit);
      expect(lineItem.description).toBe('Line item description');
      expect(lineItem.meta).toBeUndefined();
      expect(lineItem.createdAt).toEqual(validEntryPayload.createdAt);
      expect(lineItem.updatedAt).toEqual(validEntryPayload.createdAt);

      expect(Object.isFrozen(lineItem)).toBe(true);
    });

    it('should fall back to entry memo if payload description is missing', () => {
      const payloadWithoutDesc: TMakePayload = {
        ...validPayload,
        description: undefined,
      };

      const [lineItem] = journalLineItemEntity.make(
        validEntryPayload,
        payloadWithoutDesc,
        USD
      );

      expect(lineItem.description).toBe('General Memo');
    });

    it('should throw an AppError if side is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        side: 'invalid' as UJournalEntrySide,
      };

      expect(() =>
        journalLineItemEntity.make(validEntryPayload, invalidPayload, USD)
      ).toThrow(AppError);
    });
  });

  describe('Helpers', () => {
    describe('validateSide', () => {
      it('should not throw for valid sides', () => {
        expect(() =>
          journalLineItemEntity.validateSide(EEJournalEntrySide.Debit)
        ).not.toThrow();
        expect(() =>
          journalLineItemEntity.validateSide(EEJournalEntrySide.Credit)
        ).not.toThrow();
      });

      it('should throw an AppError for an invalid side', () => {
        expect(() =>
          journalLineItemEntity.validateSide('invalid' as UJournalEntrySide)
        ).toThrow(AppError);
      });
    });

    describe('getDescription', () => {
      it('should return trimmed description', () => {
        expect(journalLineItemEntity.getDescription('  test desc  ')).toBe(
          'test desc'
        );
      });

      it('should throw if description is too long', () => {
        const longDesc = 'a'.repeat(101);
        expect(() => journalLineItemEntity.getDescription(longDesc)).toThrow(
          AppError
        );
      });

      it('should throw if description is too short (empty)', () => {
        expect(() => journalLineItemEntity.getDescription('')).toThrow(
          AppError
        );
      });
    });
  });
});
