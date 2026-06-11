import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IJournalEntry } from '../types/journal-entry.types';

export default interface IJournalEntryRepo {
  save(
    payload: IJournalEntry | IJournalEntry[],
    options: IWriteRepoOptions
  ): Promise<void>;

  findById(
    id: TEntityId,
    options: IReadRepoOptions
  ): Promise<IJournalEntry | null>;
}
