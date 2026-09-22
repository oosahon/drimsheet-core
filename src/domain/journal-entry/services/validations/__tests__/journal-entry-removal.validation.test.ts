import generateUUID from '@shared/utils/uuid-generator';

import journalEntryEntity from '@domain/journal-entry/entities/journal-entry.entity';
import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import journalEntryRemovalValidation from '@domain/journal-entry/services/validations/journal-entry-removal.validation';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  IJournalEntry,
  UJournalEntrySourceType,
} from '@domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import moneyValue from '@domain/money/values/money.vo';

describe('journalEntryRemovalValidation', () => {
  const postedAt = new Date('2026-09-22T10:00:00.000Z');

  function makeEntry(
    sourceType: UJournalEntrySourceType,
    postingDate: Date | null
  ) {
    const amount = moneyValue.make(100, SYSTEM_CURRENCIES.NGN, false);

    return journalEntryEntity.make({
      accountingEntityId: generateUUID(),
      sourceType,
      effectiveDate: postedAt,
      postedAt: postingDate,
      memo: null,
      createdBy: generateUUID(),
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: generateUUID(),
          sequenceOrder: 1,
          amount,
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: null,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: generateUUID(),
          sequenceOrder: 2,
          amount,
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: null,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    })[0];
  }

  it('is frozen', () => {
    expect(Object.isFrozen(journalEntryRemovalValidation)).toBe(true);
  });

  it('rejects reversal source types', () => {
    const entry = makeEntry(EJournalEntrySourceType.Reversal, postedAt);

    expect(() =>
      journalEntryRemovalValidation.validateSourceType(entry)
    ).toThrow(journalEntryError.DeletionNotPermitted);
  });

  it.each([
    makeEntry(EJournalEntrySourceType.Expense, null),
    makeEntry(EJournalEntrySourceType.Expense, postedAt),
    {
      ...makeEntry(EJournalEntrySourceType.Expense, null),
      status: EJournalEntryStatus.Archived,
    },
    {
      ...makeEntry(EJournalEntrySourceType.Expense, postedAt),
      status: EJournalEntryStatus.Archived,
    },
  ])('accepts a consistent $status state', (entry) => {
    expect(() =>
      journalEntryRemovalValidation.validateState(entry)
    ).not.toThrow();
  });

  it.each([
    {
      ...makeEntry(EJournalEntrySourceType.Expense, null),
      status: EJournalEntryStatus.Draft,
      postedAt,
    },
    {
      ...makeEntry(EJournalEntrySourceType.Expense, postedAt),
      status: EJournalEntryStatus.Posted,
      postedAt: null,
    },
    {
      ...makeEntry(EJournalEntrySourceType.Expense, postedAt),
      status: EJournalEntryStatus.Voided,
    },
  ] satisfies IJournalEntry[])(
    'rejects an inconsistent $status state',
    (entry) => {
      expect(() => journalEntryRemovalValidation.validateState(entry)).toThrow(
        journalEntryError.DeletionNotPermitted
      );
    }
  );
});
