import zodValidationRunner from '@shared/utils/zod-validation-runner';

import { journalEntryDeletionReqValidation } from '@app/journal-entry/dtos/journal-entry-deletion/journal-entry-deletion.dto.validation';

describe('journalEntryDeletionReqValidation', () => {
  it('accepts a positive integer expected version', () => {
    expect(() =>
      zodValidationRunner(journalEntryDeletionReqValidation, {
        expectedVersion: 1,
      })
    ).not.toThrow();
  });

  it.each([
    {},
    { expectedVersion: 0 },
    { expectedVersion: -1 },
    { expectedVersion: 1.5 },
    { expectedVersion: '1' },
    { expectedVersion: 1, extra: true },
  ])('rejects an invalid request %#', (payload) => {
    expect(() =>
      zodValidationRunner(journalEntryDeletionReqValidation, payload)
    ).toThrow();
  });
});
