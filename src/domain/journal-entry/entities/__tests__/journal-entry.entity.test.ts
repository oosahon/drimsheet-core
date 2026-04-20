import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { USD } from '../../../currency/config/currencies.config';
import { EJournalEntryEvent } from '../../events/journal-entry.events';
import { EJournalLineItemEvent } from '../../events/journal-line-item.events';
import {
  EEJournalEntrySide,
  EJournalEntryStatus,
  UJournalEntryStatus,
} from '../../types/journal-entry.types';
import journalEntryEntity from '../journal-entry.entity';

type TMakePayload = Parameters<typeof journalEntryEntity.make>[0];

describe('JournalEntry Entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    let validPayload: TMakePayload;

    beforeEach(() => {
      validPayload = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        transactionId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
        status: EJournalEntryStatus.Draft,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        memo: 'Test entry memo',
        functionalCurrency: USD,
        postedAt: null,
        voidedAt: null,
        voidedByJournalEntryId: null,
        lineItems: [
          {
            accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
            sequenceOrder: 1,
            amount: moneyValue.make(100.0, USD, false),
            exchangeRate: 1,
            side: EEJournalEntrySide.Debit,
            description: 'Line item 1',
          },
          {
            accountId: 'e682fcb3-e6dc-54ed-9f7d-304c08c1b810' as TEntityId,
            sequenceOrder: 2,
            amount: moneyValue.make(100.0, USD, false),
            exchangeRate: 1,
            side: EEJournalEntrySide.Credit,
            description: 'Line item 2',
          },
        ],
      };
    });

    it('should successfully create a journal entry with line items and events', () => {
      const [entry, events] = journalEntryEntity.make(validPayload);

      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entry.transactionId).toBe(validPayload.transactionId);
      expect(entry.memo).toBe('Test entry memo');
      expect(entry.status).toBe(EJournalEntryStatus.Draft);
      expect(entry.effectiveDate).toEqual(validPayload.effectiveDate);
      expect(entry.postedAt).toBeNull();
      expect(entry.voidedAt).toBeNull();
      expect(entry.voidedByJournalEntryId).toBeNull();
      expect(entry.version).toBe(1);
      expect(entry.createdAt).toEqual(new Date('2026-04-15T00:00:00.000Z'));
      expect(entry.updatedAt).toEqual(new Date('2026-04-15T00:00:00.000Z'));

      expect(entry.lineItems).toHaveLength(2);
      expect(entry.lineItems[0].entryId).toBe(entry.id);
      expect(entry.lineItems[0].accountId).toBe(
        validPayload.lineItems[0].accountId
      );
      expect(entry.lineItems[1].entryId).toBe(entry.id);

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe(EJournalEntryEvent.Created);
      expect(events[0].data).toEqual(entry);
      expect(events[1].type).toBe(EJournalLineItemEvent.Created);
      expect(events[1].data).toEqual(entry.lineItems[0]);
      expect(events[2].type).toBe(EJournalLineItemEvent.Created);
      expect(events[2].data).toEqual(entry.lineItems[1]);

      expect(Object.isFrozen(entry)).toBe(true);
    });

    it('should fall back to entry memo if line item description is absent', () => {
      const lineItemWithoutDesc = {
        ...validPayload.lineItems[0],
        description: undefined,
      };

      const payload: TMakePayload = {
        ...validPayload,
        lineItems: [lineItemWithoutDesc],
      };

      const [entry] = journalEntryEntity.make(payload);

      expect(entry.lineItems[0].description).toBe('Test entry memo');
    });

    it('should successfully create when optional dates and ids are provided', () => {
      const payload: TMakePayload = {
        ...validPayload,
        postedAt: new Date('2026-04-16T00:00:00.000Z'),
        voidedAt: new Date('2026-04-17T00:00:00.000Z'),
        voidedByJournalEntryId:
          '4c6e83ef-2a1b-4c3d-8d9e-5e6f7a8b9c0d' as TEntityId,
      };

      const [entry] = journalEntryEntity.make(payload);

      expect(entry.postedAt).toEqual(payload.postedAt);
      expect(entry.voidedAt).toEqual(payload.voidedAt);
      expect(entry.voidedByJournalEntryId).toBe(payload.voidedByJournalEntryId);
    });

    it('should throw an AppError if accountingEntityId is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          accountingEntityId: 'invalid' as TEntityId,
        })
      ).toThrow(AppError);
    });

    it('should throw an AppError if transactionId is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          transactionId: 'invalid' as TEntityId,
        })
      ).toThrow(AppError);
    });

    it('should throw an AppError if voidedByJournalEntryId is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          voidedByJournalEntryId: 'invalid' as TEntityId,
        })
      ).toThrow(AppError);
    });

    it('should throw an AppError if effectiveDate is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          effectiveDate: new Date('invalid'),
        })
      ).toThrow(AppError);
    });

    it('should throw an AppError if postedAt is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          postedAt: new Date('invalid'),
        })
      ).toThrow(AppError);
    });

    it('should throw an AppError if voidedAt is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          voidedAt: new Date('invalid'),
        })
      ).toThrow(AppError);
    });

    it('should throw an AppError if status is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        status: 'invalid' as UJournalEntryStatus,
      };

      expect(() => journalEntryEntity.make(invalidPayload)).toThrow(AppError);
    });
  });

  describe('Helpers', () => {
    describe('validateStatus', () => {
      it('should not throw for valid statuses', () => {
        expect(() =>
          journalEntryEntity.validateStatus(EJournalEntryStatus.Draft)
        ).not.toThrow();
        expect(() =>
          journalEntryEntity.validateStatus(EJournalEntryStatus.Posted)
        ).not.toThrow();
        expect(() =>
          journalEntryEntity.validateStatus(EJournalEntryStatus.Voided)
        ).not.toThrow();
      });

      it('should throw an AppError for an invalid status', () => {
        expect(() =>
          journalEntryEntity.validateStatus('invalid' as UJournalEntryStatus)
        ).toThrow(AppError);
      });
    });
  });
});
