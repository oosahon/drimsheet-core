import generateUUID from '@shared/utils/uuid-generator';

import updateJournalEntryLines from '@domain/journal-entry/entities/helpers/update-journal-entry-lines.helper';
import journalEntryEntity from '@domain/journal-entry/entities/journal-entry.entity';
import journalLineEntity from '@domain/journal-entry/entities/journal-line.entity';
import { EJournalEntrySourceType } from '@domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import moneyValue from '@domain/money/values/money.vo';

describe('updateJournalEntryLines', () => {
  it('updates existing lines and creates lines that are not on the entry', () => {
    const amount = moneyValue.make(10, SYSTEM_CURRENCIES.USD, false);
    const [entry] = journalEntryEntity.make({
      accountingEntityId: generateUUID(),
      sourceType: EJournalEntrySourceType.Transfer,
      effectiveDate: new Date('2026-09-01T00:00:00.000Z'),
      postedAt: null,
      memo: 'Entry memo',
      createdBy: generateUUID(),
      functionalCurrency: SYSTEM_CURRENCIES.USD,
      lines: [
        {
          accountId: generateUUID(),
          sequenceOrder: 1,
          amount,
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Existing',
          functionalCurrency: SYSTEM_CURRENCIES.USD,
        },
        {
          accountId: generateUUID(),
          sequenceOrder: 2,
          amount,
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: null,
          functionalCurrency: SYSTEM_CURRENCIES.USD,
        },
      ],
    });
    const [newLine] = journalLineEntity.make(
      { id: entry.id, memo: entry.memo, createdAt: entry.updatedAt },
      {
        accountId: generateUUID(),
        sequenceOrder: 3,
        amount,
        exchangeRate: null,
        side: EJournalSide.Debit,
        description: null,
        functionalCurrency: SYSTEM_CURRENCIES.USD,
      }
    );

    const result = updateJournalEntryLines({
      entry,
      lines: [entry.lines[0], newLine],
      memo: entry.memo,
      updatedAt: entry.updatedAt,
    });

    expect(result.lines).toEqual([entry.lines[0], newLine]);
    expect(result.events).toHaveLength(1);
    expect(result.audits).toHaveLength(1);
    expect(result.audits[0].diff).toEqual({ before: null, after: newLine });
  });
});
