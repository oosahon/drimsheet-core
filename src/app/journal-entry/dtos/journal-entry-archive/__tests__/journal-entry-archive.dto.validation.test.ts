import { journalEntryArchiveReqValidation } from '@app/journal-entry/dtos/journal-entry-archive/journal-entry-archive.dto.validation';

describe('journalEntryArchiveReqValidation', () => {
  it('accepts a positive integer expected version', () => {
    expect(
      journalEntryArchiveReqValidation.safeParse({ expectedVersion: 1 }).success
    ).toBe(true);
  });

  it.each([
    {},
    { expectedVersion: 0 },
    { expectedVersion: -1 },
    { expectedVersion: 1.5 },
    { expectedVersion: '1' },
    { expectedVersion: 1, status: 'archived' },
  ])('rejects the invalid archive request %#', (payload) => {
    expect(journalEntryArchiveReqValidation.safeParse(payload).success).toBe(
      false
    );
  });
});
