import { EJournalEntrySourceType } from '@domain/journal-entry/types/journal-entry.types';

import { getPermittedPostingAccountsQueryValidationSchema } from '@app/ledger/dtos/permitted-posting-account/permitted-posting-account.dto.validation';

describe('Permitted Posting Account DTO Validation', () => {
  it.each(Object.values(EJournalEntrySourceType))(
    'accepts the %s journal-entry source type',
    (sourceType) => {
      const result = getPermittedPostingAccountsQueryValidationSchema.safeParse(
        {
          sourceType,
          side: 'source',
        }
      );

      expect(result.success).toBe(true);
    }
  );

  it.each(['source', 'destination'] as const)(
    'accepts the %s rule side',
    (side) => {
      const result = getPermittedPostingAccountsQueryValidationSchema.safeParse(
        {
          sourceType: EJournalEntrySourceType.Receipt,
          side,
          currencyCode: 'usd',
          page: 2,
          limit: 25,
        }
      );

      expect(result.success).toBe(true);
    }
  );

  it('accepts omitted optional currency and pagination', () => {
    const result = getPermittedPostingAccountsQueryValidationSchema.safeParse({
      sourceType: EJournalEntrySourceType.OpeningBalance,
      side: 'destination',
    });

    expect(result.success).toBe(true);
  });

  it.each([
    [{ side: 'source' }, 'missing source type'],
    [{ sourceType: EJournalEntrySourceType.Receipt }, 'missing side'],
    [{ sourceType: 'not_a_source', side: 'source' }, 'invalid source type'],
    [
      { sourceType: EJournalEntrySourceType.Receipt, side: 'debit' },
      'invalid side',
    ],
    [
      {
        sourceType: EJournalEntrySourceType.Receipt,
        side: 'source',
        currencyCode: 'ZZZ',
      },
      'unsupported currency',
    ],
    [
      {
        sourceType: EJournalEntrySourceType.Receipt,
        side: 'source',
        currencyCode: 'US',
      },
      'malformed currency',
    ],
    [
      { sourceType: EJournalEntrySourceType.Receipt, side: 'source', page: 0 },
      'invalid page',
    ],
    [
      {
        sourceType: EJournalEntrySourceType.Receipt,
        side: 'source',
        limit: 201,
      },
      'invalid limit',
    ],
  ])('rejects %s (%s)', (query, _label) => {
    const result =
      getPermittedPostingAccountsQueryValidationSchema.safeParse(query);

    expect(result.success).toBe(false);
  });
});
