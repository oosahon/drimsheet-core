import journalEntryEntity from '../../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../../domain/journal-entry/types/journal-line.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import historyValue from '../../../../../shared/history/history.vo';
import { TEntityId } from '../../../../../shared/types/uuid';
import journalEntryHistoryMapper from '../journal-entry-history.mapper';
import journalLineHistoryMapper from '../journal-line-history.mapper';

describe('journal history mappers', () => {
  const actorId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
  const correlationId = 'test-correlation-id';

  const makeJournalEntry = () =>
    journalEntryEntity.make({
      accountingEntityId,
      sourceType: EJournalEntrySourceType.Transfer,
      counterPartyId: null,
      status: EJournalEntryStatus.Draft,
      effectiveDate: new Date('2026-06-14T00:00:00.000Z'),
      postedAt: null,
      voidedAt: null,
      voidingEntryId: null,
      memo: 'Transfer',
      createdBy: actorId,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
          sequenceOrder: 1,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Debit',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: '123e4567-e89b-12d3-a456-426614174004' as TEntityId,
          sequenceOrder: 2,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: 'Credit',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    });

  it('maps a journal header history record', () => {
    const [entry, , audit] = makeJournalEntry();
    const { lines: _lines, ...header } = entry;
    const history = historyValue.make(
      audit.header,
      historyValue.getUserActor(actorId),
      correlationId
    );

    expect(journalEntryHistoryMapper.toRepo(header, history)).toEqual({
      journalEntryId: entry.id,
      accountingEntityId,
      userId: actorId,
      actorType: 'user',
      action: 'created',
      diff: audit.header.diff,
      correlationId,
      entityVersion: 1,
      occurredAt: entry.updatedAt.toISOString(),
    });
  });

  it('maps journal line snapshots into JSON-safe repository values', () => {
    const [entry, , audit] = makeJournalEntry();
    const history = historyValue.make(
      audit.lines[0],
      historyValue.getUserActor(actorId),
      correlationId
    );

    const result = journalLineHistoryMapper.toRepo(
      entry.lines[0],
      history,
      accountingEntityId
    );

    expect(result).toEqual(
      expect.objectContaining({
        journalLineId: entry.lines[0].id,
        journalEntryId: entry.id,
        accountingEntityId,
        userId: actorId,
        actorType: 'user',
        action: 'created',
        correlationId,
        entityVersion: 1,
        occurredAt: entry.lines[0].updatedAt.toISOString(),
      })
    );
    expect(result.diff).toEqual({
      before: null,
      after: expect.objectContaining({
        id: entry.lines[0].id,
        amount: 1000,
        currencyCode: SYSTEM_CURRENCIES.NGN.code,
      }),
    });
  });
});
