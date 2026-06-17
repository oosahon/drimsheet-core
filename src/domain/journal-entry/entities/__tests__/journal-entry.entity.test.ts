import { TEntityId } from '../../../../shared/types/uuid';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { SYSTEM_CURRENCIES } from '../../../currency/config/currencies.config';
import { EJournalEntryEvent } from '../../events/journal-entry.events';
import { EJournalLineItemEvent } from '../../events/journal-line-item.events';
import {
  EJournalEntryAuditAction,
  EJournalLineAuditAction,
} from '../../types/journal-entry-audit.types';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from '../../types/journal-entry.types';
import { EJournalSide, IJournalLine } from '../../types/journal-line.types';
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
        sourceType: EJournalEntrySourceType.Expense,
        counterPartyId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
        status: EJournalEntryStatus.Draft,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        memo: 'Test entry memo',
        functionalCurrency: SYSTEM_CURRENCIES.USD,
        postedAt: null,
        voidedAt: null,
        voidingEntryId: null,
        createdBy: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' as TEntityId,
        lines: [
          {
            accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
            sequenceOrder: 1,
            amount: moneyValue.make(100.0, SYSTEM_CURRENCIES.USD, false),
            exchangeRate: null,
            side: EJournalSide.Debit,
            description: 'Line item 1',
            functionalCurrency: SYSTEM_CURRENCIES.USD,
          },
          {
            accountId: 'e682fcb3-e6dc-54ed-9f7d-304c08c1b810' as TEntityId,
            sequenceOrder: 2,
            amount: moneyValue.make(100.0, SYSTEM_CURRENCIES.USD, false),
            exchangeRate: null,
            side: EJournalSide.Credit,
            description: 'Line item 2',
            functionalCurrency: SYSTEM_CURRENCIES.USD,
          },
        ],
      };
    });

    it('should successfully create a journal entry with line items and events', () => {
      const [entry, events, audit] = journalEntryEntity.make(validPayload);

      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entry.sourceType).toBe(validPayload.sourceType);
      expect(entry.counterPartyId).toBe(validPayload.counterPartyId);
      expect(entry.memo).toBe('Test entry memo');
      expect(entry.status).toBe(EJournalEntryStatus.Draft);
      expect(entry.effectiveDate).toEqual(validPayload.effectiveDate);
      expect(entry.postedAt).toBeNull();
      expect(entry.voidedAt).toBeNull();
      expect(entry.voidingEntryId).toBeNull();
      expect(entry.version).toBe(1);
      expect(entry.createdAt).toEqual(new Date('2026-04-15T00:00:00.000Z'));
      expect(entry.updatedAt).toEqual(new Date('2026-04-15T00:00:00.000Z'));
      expect(entry.createdBy).toBe(validPayload.createdBy);

      expect(entry.lines).toHaveLength(2);
      expect(entry.lines[0].entryId).toBe(entry.id);
      expect(entry.lines[0].accountId).toBe(validPayload.lines[0].accountId);
      expect(entry.lines[1].entryId).toBe(entry.id);

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe(EJournalEntryEvent.Created);
      expect(events[0].data).toEqual(entry);
      expect(events[1].type).toBe(EJournalLineItemEvent.Created);
      expect(events[1].data).toEqual(entry.lines[0]);
      expect(events[2].type).toBe(EJournalLineItemEvent.Created);
      expect(events[2].data).toEqual(entry.lines[1]);

      expect(Object.isFrozen(entry)).toBe(true);
      expect(audit.header.action).toBe(EJournalEntryAuditAction.Created);
      expect(audit.header.diff.before).toBeNull();
      expect(audit.header.diff.after).not.toHaveProperty('lines');
      expect(audit.lines).toHaveLength(2);
      expect(audit.lines[0]).toEqual({
        entityId: entry.lines[0].id,
        action: EJournalLineAuditAction.Created,
        diff: {
          before: null,
          after: entry.lines[0],
        },
        occurredAt: entry.lines[0].updatedAt,
      });
    });

    it('should fall back to entry memo if line item description is absent', () => {
      const lineItemWithoutDesc = {
        ...validPayload.lines[0],
        description: null,
      };

      const payload: TMakePayload = {
        ...validPayload,
        lines: [lineItemWithoutDesc, validPayload.lines[1]],
      };

      const [entry] = journalEntryEntity.make(payload);

      expect(entry.lines[0].description).toBe('Test entry memo');
    });

    it('should successfully create when optional dates and ids are provided', () => {
      const payload: TMakePayload = {
        ...validPayload,
        postedAt: new Date('2026-04-16T00:00:00.000Z'),
        voidedAt: new Date('2026-04-17T00:00:00.000Z'),
        voidingEntryId: '4c6e83ef-2a1b-4c3d-8d9e-5e6f7a8b9c0d' as TEntityId,
      };

      const [entry] = journalEntryEntity.make(payload);

      expect(entry.postedAt).toEqual(payload.postedAt);
      expect(entry.voidedAt).toEqual(payload.voidedAt);
      expect(entry.voidingEntryId).toBe(payload.voidingEntryId);
    });

    it('should throw an AppError if accountingEntityId is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          accountingEntityId: 'invalid' as TEntityId,
        })
      ).toThrow();
    });

    it('should throw an AppError if sourceType is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          sourceType: 'invalid' as UJournalEntrySourceType,
        })
      ).toThrow();
    });

    it('should throw an AppError if voidingEntryId is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          voidingEntryId: 'invalid' as TEntityId,
        })
      ).toThrow();
    });

    it('should throw an AppError if effectiveDate is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          effectiveDate: new Date('invalid'),
        })
      ).toThrow();
    });

    it('should throw an AppError if postedAt is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          postedAt: new Date('invalid'),
        })
      ).toThrow();
    });

    it('should throw an AppError if voidedAt is invalid', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          voidedAt: new Date('invalid'),
        })
      ).toThrow();
    });

    it('should throw an AppError if status is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        status: 'invalid' as UJournalEntryStatus,
      };

      expect(() => journalEntryEntity.make(invalidPayload)).toThrow();
    });

    it('should throw an AppError if there are only debits or only credits', () => {
      const payload: TMakePayload = {
        ...validPayload,
        lines: [
          validPayload.lines[0],
          {
            ...validPayload.lines[1],
            side: EJournalSide.Debit,
          },
        ],
      };

      expect(() => journalEntryEntity.make(payload)).toThrow();
    });

    it('should throw an AppError if total debits do not equal total credits', () => {
      const payload: TMakePayload = {
        ...validPayload,
        lines: [
          validPayload.lines[0],
          {
            ...validPayload.lines[1],
            amount: moneyValue.make(50.0, SYSTEM_CURRENCIES.USD, false),
          },
        ],
      };

      expect(() => journalEntryEntity.make(payload)).toThrow();
    });

    it('should throw an AppError if sequence orders are not unique', () => {
      const payload: TMakePayload = {
        ...validPayload,
        lines: [
          validPayload.lines[0],
          {
            ...validPayload.lines[1],
            sequenceOrder: validPayload.lines[0].sequenceOrder,
          },
        ],
      };

      expect(() => journalEntryEntity.make(payload)).toThrow();
    });

    it('should throw an AppError if there are less than 2 line items', () => {
      const payload: TMakePayload = {
        ...validPayload,
        lines: [validPayload.lines[0]],
      };

      expect(() => journalEntryEntity.make(payload)).toThrow();
    });

    it('should throw an AppError if there are no line items', () => {
      const payload: TMakePayload = {
        ...validPayload,
        lines: [],
      };

      expect(() => journalEntryEntity.make(payload)).toThrow();
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
        ).toThrow();
      });
    });

    describe('validateLine', () => {
      it('throws an AppError for an invalid side', () => {
        const item1: IJournalLine = {
          id: '1' as TEntityId,
          entryId: '2' as TEntityId,
          accountId: '3' as TEntityId,
          sequenceOrder: 1,
          amount: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
          exchangeRate: null,
          functionalAmount: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
          // @ts-expect-error Testing invalid side at runtime
          side: 'InvalidSide',
          description: 'test',
          meta: null,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const item2: IJournalLine = {
          ...item1,
          id: '4' as TEntityId,
          sequenceOrder: 2,
          side: EJournalSide.Credit,
        };

        expect(() => journalEntryEntity.validateLine([item1, item2])).toThrow();
      });
    });

    describe('getMemo', () => {
      it('should return null if value is empty or null', () => {
        // @ts-expect-error Testing undefined fallback at runtime
        expect(journalEntryEntity.getMemo(undefined)).toBeNull();
        expect(journalEntryEntity.getMemo(null)).toBeNull();
        expect(journalEntryEntity.getMemo('')).toBeNull();
      });

      it('should throw an AppError if memo is too long', () => {
        const longMemo = 'a'.repeat(251);
        expect(() => journalEntryEntity.getMemo(longMemo)).toThrow();
      });

      it('should return trimmed memo', () => {
        expect(journalEntryEntity.getMemo('  valid memo  ')).toBe('valid memo');
      });
    });

    describe('validateSourceType', () => {
      it('should not throw for valid source types', () => {
        for (const sourceType of Object.values(EJournalEntrySourceType)) {
          expect(() =>
            journalEntryEntity.validateSourceType(sourceType)
          ).not.toThrow();
        }
      });

      it('should throw for an invalid source type', () => {
        expect(() =>
          journalEntryEntity.validateSourceType(
            'invalid' as UJournalEntrySourceType
          )
        ).toThrow();
      });
    });

    describe('validateCounterpartyId', () => {
      it('should not throw when counterPartyId is null', () => {
        expect(() =>
          journalEntryEntity.validateCounterpartyId(
            EJournalEntrySourceType.Sale,
            null
          )
        ).not.toThrow();
      });

      it('should not throw for valid counterPartyId with non-transfer source', () => {
        expect(() =>
          journalEntryEntity.validateCounterpartyId(
            EJournalEntrySourceType.Sale,
            '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId
          )
        ).not.toThrow();
      });

      it('should throw when counterPartyId is provided for transfer source type', () => {
        expect(() =>
          journalEntryEntity.validateCounterpartyId(
            EJournalEntrySourceType.Transfer,
            '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId
          )
        ).toThrow();
      });

      it('should throw when counterPartyId is not a valid UUID', () => {
        expect(() =>
          journalEntryEntity.validateCounterpartyId(
            EJournalEntrySourceType.Sale,
            'invalid' as TEntityId
          )
        ).toThrow();
      });
    });

    describe('validateStatus with Archived', () => {
      it('should not throw for Archived status', () => {
        expect(() =>
          journalEntryEntity.validateStatus(EJournalEntryStatus.Archived)
        ).not.toThrow();
      });
    });
  });
});
