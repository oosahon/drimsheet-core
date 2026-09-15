import { IJournalEntryRule } from '@domain/journal-entry/types/entry.rules.types';
import { UJournalEntrySourceType } from '@domain/journal-entry/types/journal-entry.types';

export interface IGetPermittedPostingAccountsQuery {
  sourceType: UJournalEntrySourceType;
  side: keyof IJournalEntryRule;
  filterSuspense?: boolean;
  currencyCode?: string;
  page?: number;
  limit?: number;
}
