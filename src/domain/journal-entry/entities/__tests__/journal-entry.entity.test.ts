import moneyValue from '../../../../domain/money/values/money.vo';
import { TEntityId } from '../../../../shared/types/uuid';
import { SYSTEM_CURRENCIES } from '../../../money/config/currencies.config';
import journalEntryError from '../../errors/journal-entry.error';
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
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        memo: 'Test entry memo',
        functionalCurrency: SYSTEM_CURRENCIES.USD,
        postedAt: null,
        createdBy: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' as TEntityId,
        lines: [
          {
            accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
            counterpartyId: '3c5d72bc-1d2a-4a8b-8c0d-1e2f3a4b5c6d' as TEntityId,
            sequenceOrder: 1,
            amount: moneyValue.make(100.0, SYSTEM_CURRENCIES.USD, false),
            exchangeRate: null,
            side: EJournalSide.Debit,
            description: 'Line item 1',
            functionalCurrency: SYSTEM_CURRENCIES.USD,
          },
          {
            accountId: 'e682fcb3-e6dc-54ed-9f7d-304c08c1b810' as TEntityId,
            counterpartyId: null,
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
      expect(entry).not.toHaveProperty('counterpartyId');
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
      expect(entry.lines[0].counterpartyId).toBe(
        validPayload.lines[0].counterpartyId
      );
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

    it('should create posted entries with the supplied posting date', () => {
      const payload: TMakePayload = {
        ...validPayload,
        postedAt: new Date('2026-04-16T00:00:00.000Z'),
      };

      const [entry] = journalEntryEntity.make(payload);

      expect(entry.postedAt).toEqual(payload.postedAt);
      expect(entry.voidedAt).toBeNull();
      expect(entry.voidingEntryId).toBeNull();
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

    it('should reject a transfer line with a counterparty', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          sourceType: EJournalEntrySourceType.Transfer,
        })
      ).toThrow(journalEntryError.CounterpartyIdNotAllowed);
    });

    it('should reject an invalid line counterparty ID', () => {
      expect(() =>
        journalEntryEntity.make({
          ...validPayload,
          lines: [
            {
              ...validPayload.lines[0],
              counterpartyId: 'invalid' as TEntityId,
            },
            validPayload.lines[1],
          ],
        })
      ).toThrow();
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
          counterpartyId: null,
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
  });

  describe('lifecycle transitions', () => {
    function makeEntry(postedAt: Date | null) {
      return journalEntryEntity.make({
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        sourceType: EJournalEntrySourceType.Expense,
        effectiveDate: new Date('2026-04-15T00:00:00.000Z'),
        postedAt,
        memo: 'Test entry memo',
        functionalCurrency: SYSTEM_CURRENCIES.USD,
        createdBy: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' as TEntityId,
        lines: [
          {
            accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
            sequenceOrder: 1,
            amount: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
            exchangeRate: null,
            side: EJournalSide.Debit,
            description: 'Debit',
            functionalCurrency: SYSTEM_CURRENCIES.USD,
          },
          {
            accountId: 'e682fcb3-e6dc-54ed-9f7d-304c08c1b810' as TEntityId,
            sequenceOrder: 2,
            amount: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
            exchangeRate: null,
            side: EJournalSide.Credit,
            description: 'Credit',
            functionalCurrency: SYSTEM_CURRENCIES.USD,
          },
        ],
      })[0];
    }

    it('should void a posted entry with audit and event metadata', () => {
      const entry = makeEntry(new Date('2026-04-15T00:00:00.000Z'));
      const voidingEntryId =
        '4c6e83ef-2a1b-4c3d-8d9e-5e6f7a8b9c0d' as TEntityId;

      const [voidedEntry, events, audit] = journalEntryEntity.void(entry, {
        voidingEntryId,
      });

      expect(voidedEntry).toEqual(
        expect.objectContaining({
          status: EJournalEntryStatus.Voided,
          postedAt: entry.postedAt,
          voidedAt: new Date('2026-04-15T00:00:00.000Z'),
          voidingEntryId,
          version: 2,
        })
      );
      expect(Object.isFrozen(voidedEntry)).toBe(true);
      expect(events).toEqual([
        expect.objectContaining({ type: EJournalEntryEvent.Voided }),
      ]);
      expect(audit.action).toBe(EJournalEntryAuditAction.Voided);
      expect(audit.diff.before).toEqual(
        expect.objectContaining({ id: entry.id })
      );
    });

    it('should reject voiding a draft entry', () => {
      const draftEntry = makeEntry(null);

      expect(() =>
        journalEntryEntity.void(draftEntry, {
          voidingEntryId: '4c6e83ef-2a1b-4c3d-8d9e-5e6f7a8b9c0d' as TEntityId,
        })
      ).toThrow(journalEntryError.InvalidStatusTransition);
    });

    it('should reject an invalid voiding entry id', () => {
      expect(() =>
        journalEntryEntity.void(
          makeEntry(new Date('2026-04-15T00:00:00.000Z')),
          {
            voidingEntryId: 'invalid' as TEntityId,
          }
        )
      ).toThrow(journalEntryError.InvalidValue);
    });

    it('should archive draft and posted entries with audit and event metadata', () => {
      const entry = makeEntry(new Date('2026-04-15T00:00:00.000Z'));

      const [archivedEntry, events, audit] = journalEntryEntity.archive(entry);

      expect(archivedEntry).toEqual(
        expect.objectContaining({
          status: EJournalEntryStatus.Archived,
          version: 2,
        })
      );
      expect(events).toEqual([
        expect.objectContaining({ type: EJournalEntryEvent.Archived }),
      ]);
      expect(audit.action).toBe(EJournalEntryAuditAction.Archived);
    });

    it('should archive a draft entry', () => {
      const [archivedEntry] = journalEntryEntity.archive(makeEntry(null));

      expect(archivedEntry.status).toBe(EJournalEntryStatus.Archived);
      expect(archivedEntry.postedAt).toBeNull();
    });

    it('should reject archiving a voided entry', () => {
      const [voidedEntry] = journalEntryEntity.void(
        makeEntry(new Date('2026-04-15T00:00:00.000Z')),
        {
          voidingEntryId: '4c6e83ef-2a1b-4c3d-8d9e-5e6f7a8b9c0d' as TEntityId,
        }
      );

      expect(() => journalEntryEntity.archive(voidedEntry)).toThrow(
        journalEntryError.InvalidStatusTransition
      );
    });
  });
});
