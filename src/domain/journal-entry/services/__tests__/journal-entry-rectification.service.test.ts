import generateUUID from '@shared/utils/uuid-generator';

import journalEntryEntity from '@domain/journal-entry/entities/journal-entry.entity';
import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import makeJournalEntryRectificationService from '@domain/journal-entry/services/journal-entry-rectification.service';
import {
  EJournalEntryRectificationMode,
  IJournalEntryRectificationPayload,
} from '@domain/journal-entry/types/journal-entry-rectification.types';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  IJournalEntry,
} from '@domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import moneyValue from '@domain/money/values/money.vo';

describe('makeJournalEntryRectificationService', () => {
  const accountingEntityId = generateUUID();
  const createdBy = generateUUID();
  const debitAccountId = generateUUID();
  const creditAccountId = generateUUID();
  const effectiveDate = new Date('2026-09-01T00:00:00.000Z');
  const now = new Date('2026-09-21T09:30:00.000Z');
  const service = makeJournalEntryRectificationService();

  function makeEntry(options?: {
    posted?: boolean;
    amount?: number;
    memo?: string | null;
    description?: string | null;
    attachments?: { url: string; name: string; type: string; size: number }[];
  }) {
    const amount = moneyValue.make(
      options?.amount ?? 100,
      SYSTEM_CURRENCIES.USD,
      false
    );

    return journalEntryEntity.make({
      accountingEntityId,
      sourceType: EJournalEntrySourceType.Transfer,
      effectiveDate,
      postedAt: options?.posted ? effectiveDate : null,
      memo: options?.memo ?? null,
      createdBy,
      functionalCurrency: SYSTEM_CURRENCIES.USD,
      attachments: options?.attachments ?? [],
      lines: [
        {
          accountId: debitAccountId,
          counterpartyId: null,
          sequenceOrder: 1,
          amount,
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: options?.description ?? null,
          functionalCurrency: SYSTEM_CURRENCIES.USD,
        },
        {
          accountId: creditAccountId,
          counterpartyId: null,
          sequenceOrder: 2,
          amount,
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: null,
          functionalCurrency: SYSTEM_CURRENCIES.USD,
        },
      ],
    });
  }

  function makePayload(
    originalEntry: IJournalEntry,
    newEntryResult: ReturnType<typeof makeEntry>
  ): IJournalEntryRectificationPayload {
    const [newEntry] = newEntryResult;

    return {
      originalEntry,
      newEntry: {
        ...newEntry,
        lines: newEntry.lines.map((line, index) => ({
          ...line,
          id: originalEntry.lines[index]?.id ?? line.id,
        })),
      },
    };
  }

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => jest.useRealTimers());

  it('exposes only the rectify operation', () => {
    expect(Object.keys(service)).toEqual(['rectify']);
    expect(Object.isFrozen(service)).toBe(true);
  });

  it('updates a draft journal entry in place', () => {
    const [originalEntry] = makeEntry();
    const newEntry = makeEntry({ amount: 125 });

    const result = service.rectify(makePayload(originalEntry, newEntry));

    expect(result.mode).toBe(EJournalEntryRectificationMode.UpdateDraft);
    expect(result.currentJournalEntry.id).toBe(originalEntry.id);
    expect(result.currentJournalEntry.version).toBe(2);
    expect(result.currentJournalEntry.lines[0]).toMatchObject({
      id: originalEntry.lines[0].id,
      entryId: originalEntry.id,
      version: 2,
    });
    expect(result.entriesToCreate).toEqual([]);
    expect(result.entryUpdate?.linesToUpdate).toHaveLength(2);
  });

  it('tracks deleted lines when updating a draft entry', () => {
    const [originalEntry] = makeEntry();
    const newEntry = makePayload(originalEntry, makeEntry({ amount: 125 }));
    newEntry.newEntry.lines = [
      newEntry.newEntry.lines![0],
      { ...newEntry.newEntry.lines![1], id: generateUUID() },
    ];

    const result = service.rectify(newEntry);

    expect(result.entryUpdate?.lineIdsToDelete).toEqual([
      originalEntry.lines[1].id,
    ]);
  });

  it('updates only descriptions and attachments on a posted journal entry', () => {
    const [originalEntry] = makeEntry({ posted: true });
    const newEntry = makeEntry({
      posted: true,
      description: 'Corrected description',
      attachments: [
        {
          url: 'https://files.example.com/corrected.pdf',
          name: 'corrected.pdf',
          type: 'application/pdf',
          size: 2_048,
        },
      ],
    });

    const result = service.rectify(makePayload(originalEntry, newEntry));

    expect(result.mode).toBe(EJournalEntryRectificationMode.UpdateMeta);
    expect(result.currentJournalEntry.id).toBe(originalEntry.id);
    expect(result.currentJournalEntry.status).toBe(EJournalEntryStatus.Posted);
    expect(result.currentJournalEntry.postedAt).toEqual(originalEntry.postedAt);
    expect(result.currentJournalEntry.lines[0].description).toBe(
      'Corrected description'
    );
    expect(result.currentJournalEntry.attachments).toHaveLength(1);
    expect(result.entryUpdate?.headerAudit.diff.before).toMatchObject({
      attachments: originalEntry.attachments,
    });
  });

  it('voids and replaces a posted journal entry when an accounting value changes', () => {
    const [originalEntry] = makeEntry({ posted: true });
    const newEntry = makeEntry({ posted: true, amount: 150 });

    const result = service.rectify(makePayload(originalEntry, newEntry));

    expect(result.mode).toBe(EJournalEntryRectificationMode.VoidAndReplace);
    expect(result.entriesToCreate).toHaveLength(2);
    expect(result.reversingJournalEntry).toMatchObject({
      sourceType: EJournalEntrySourceType.Reversal,
      status: EJournalEntryStatus.Posted,
      effectiveDate: now,
      postedAt: now,
    });
    expect(
      result.reversingJournalEntry?.lines.map((line) => line.side)
    ).toEqual([EJournalSide.Credit, EJournalSide.Debit]);
    expect(result.entryUpdate?.entry).toMatchObject({
      id: originalEntry.id,
      status: EJournalEntryStatus.Voided,
      voidedAt: now,
      voidingEntryId: result.reversingJournalEntry?.id,
    });
    expect(result.currentJournalEntry).toMatchObject({
      id: newEntry[0].id,
      version: 1,
    });
    expect(result.currentJournalEntry.lines.map((line) => line.id)).not.toEqual(
      newEntry[0].lines.map((line) => line.id)
    );
  });

  it('voids and replaces a posted journal entry when its memo changes', () => {
    const [originalEntry] = makeEntry({ posted: true, memo: 'Before' });
    const newEntry = makeEntry({ posted: true, memo: 'After' });

    const result = service.rectify(makePayload(originalEntry, newEntry));

    expect(result.mode).toBe(EJournalEntryRectificationMode.VoidAndReplace);
  });

  it('uses the original lines when a replacement omits lines', () => {
    const [originalEntry] = makeEntry({ posted: true, memo: 'Before' });

    const result = service.rectify({
      originalEntry,
      newEntry: { id: generateUUID(), memo: null },
    });

    expect(result.currentJournalEntry.lines).toHaveLength(2);
  });

  it('uses the original memo when a replacement omits memo', () => {
    const [originalEntry] = makeEntry({ posted: true, memo: 'Before' });

    const result = service.rectify({
      originalEntry,
      newEntry: {
        id: generateUUID(),
        effectiveDate: new Date('2026-09-02T00:00:00.000Z'),
      },
    });

    expect(result.currentJournalEntry.memo).toBe('Before');
  });

  it('rejects a rectification with no changes', () => {
    const [originalEntry] = makeEntry();
    const newEntry = makeEntry();

    expect(() => service.rectify(makePayload(originalEntry, newEntry))).toThrow(
      journalEntryError.RectificationHasNoChanges
    );
  });

  it('rejects an already voided journal entry', () => {
    const [entry] = makeEntry({ posted: true });
    const originalEntry: IJournalEntry = {
      ...entry,
      status: EJournalEntryStatus.Voided,
      voidedAt: now,
    };

    expect(() =>
      service.rectify(makePayload(originalEntry, makeEntry({ posted: true })))
    ).toThrow(journalEntryError.RectificationNotPermitted);
  });
});
