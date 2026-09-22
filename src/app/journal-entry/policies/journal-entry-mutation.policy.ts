import { TEntityId } from '@shared/types/uuid';
import appError from '@shared/values/errors/app.error';

import { IJournalEntry } from '@domain/journal-entry/types/journal-entry.types';

interface IValidateJournalEntryMutationPayload {
  id: string;
  entry: IJournalEntry | null;
  accountingEntityId: TEntityId;
  userId: TEntityId;
  expectedVersion: number;
}

function validate(
  payload: IValidateJournalEntryMutationPayload
): IJournalEntry {
  const { id, entry, accountingEntityId, userId, expectedVersion } = payload;

  if (entry?.accountingEntityId !== accountingEntityId) {
    throw new appError.ResourceNotFound({ id });
  }

  if (entry.createdBy !== userId) {
    throw new appError.Forbidden({ id });
  }

  if (entry.version !== expectedVersion) {
    throw new appError.Conflict({
      expectedVersion,
      actualVersion: entry.version,
    });
  }

  return entry;
}

const journalEntryMutationPolicy = Object.freeze({ validate });

export default journalEntryMutationPolicy;
