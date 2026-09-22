import { TEntityId } from '@shared/types/uuid';
import appError from '@shared/values/errors/app.error';

import { IJournalEntry } from '@domain/journal-entry/types/journal-entry.types';

import journalEntryMutationPolicy from '@app/journal-entry/policies/journal-entry-mutation.policy';

describe('journalEntryMutationPolicy', () => {
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const userId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
  const otherUserId = '123e4567-e89b-12d3-a456-426614174006' as TEntityId;
  const entry = {
    id: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    accountingEntityId,
    createdBy: userId,
    version: 2,
  } as IJournalEntry;

  const validate = (candidate: IJournalEntry | null = entry) =>
    journalEntryMutationPolicy.validate({
      id: entry.id,
      entry: candidate,
      accountingEntityId,
      userId,
      expectedVersion: entry.version,
    });

  it('returns an entry authorized for mutation', () => {
    expect(validate()).toBe(entry);
  });

  it.each([
    ['missing', null],
    [
      'outside the active accounting entity',
      {
        ...entry,
        accountingEntityId: '123e4567-e89b-12d3-a456-426614174004' as TEntityId,
        createdBy: otherUserId,
        version: 3,
      },
    ],
  ])('hides an entry that is %s', (_, candidate) => {
    expect(() => validate(candidate)).toThrow(appError.ResourceNotFound);
  });

  it('rejects another creator before checking the version', () => {
    expect(() =>
      journalEntryMutationPolicy.validate({
        id: entry.id,
        entry: { ...entry, createdBy: otherUserId },
        accountingEntityId,
        userId,
        expectedVersion: entry.version + 1,
      })
    ).toThrow(appError.Forbidden);
  });

  it('rejects a stale expected version', () => {
    expect(() =>
      journalEntryMutationPolicy.validate({
        id: entry.id,
        entry,
        accountingEntityId,
        userId,
        expectedVersion: entry.version - 1,
      })
    ).toThrow(appError.Conflict);
  });
});
