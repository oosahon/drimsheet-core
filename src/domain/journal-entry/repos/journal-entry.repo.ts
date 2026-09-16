import {
  IPaginatedReadRepoOptions,
  IReadRepoOptions,
  IWriteRepoOptions,
} from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import { IPaginatedResponse } from '@shared/values/pagination/types/pagination.types';

import { IJournalEntryHistory } from '@domain/journal-entry/types/journal-entry-audit.types';
import {
  IJournalEntry,
  IJournalHeader,
} from '@domain/journal-entry/types/journal-entry.types';

export const EJournalEntrySortBy = {
  CreatedAt: 'createdAt',
  EffectiveDate: 'effectiveDate',
} as const;

export type UJournalEntrySortBy =
  (typeof EJournalEntrySortBy)[keyof typeof EJournalEntrySortBy];

export interface IFindAllJournalEntriesOptions extends Omit<
  IPaginatedReadRepoOptions,
  'orderBy'
> {
  accountId?: TEntityId;
  orderBy?: UJournalEntrySortBy;
}

export default interface IJournalEntryRepo {
  create(
    payload: IJournalHeader | IJournalHeader[],
    options: IWriteRepoOptions<IJournalEntryHistory | IJournalEntryHistory[]>
  ): Promise<void>;

  findById(
    id: TEntityId,
    options: IReadRepoOptions
  ): Promise<IJournalEntry | null>;

  findAll(
    accountingEntityId: TEntityId,
    options: IFindAllJournalEntriesOptions
  ): Promise<IPaginatedResponse<IJournalEntry>>;
}
