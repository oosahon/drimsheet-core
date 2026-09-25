import { IAuthorizationResource } from '@shared/types/authorization-resource.types';

import {
  EJournalEntryStatus,
  UJournalEntryStatus,
} from '@domain/journal-entry/types/journal-entry.types';

export const EJournalEntryAction = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
} as const;

export type UJournalEntryAction =
  (typeof EJournalEntryAction)[keyof typeof EJournalEntryAction];

type TJournalEntryResource = IAuthorizationResource<
  UJournalEntryAction,
  UJournalEntryStatus
>;

// Journal-entry permissions also cover the entry's journal lines.
export const journalEntryResource = {
  name: 'journal_entry',
  permissions: [
    {
      action: EJournalEntryAction.Create,
      state: EJournalEntryStatus.Draft,
    },
    {
      action: EJournalEntryAction.Create,
      state: EJournalEntryStatus.Posted,
    },
    { action: EJournalEntryAction.Read },
    {
      action: EJournalEntryAction.Update,
      state: EJournalEntryStatus.Draft,
    },
    {
      action: EJournalEntryAction.Update,
      state: EJournalEntryStatus.Posted,
    },
  ],
} as const satisfies TJournalEntryResource;
