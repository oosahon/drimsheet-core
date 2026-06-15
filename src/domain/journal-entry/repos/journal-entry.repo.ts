import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IJournalEntry, IJournalHeader } from '../types/journal-entry.types';

export default interface IJournalEntryRepo {
  create(
    payload: IJournalHeader | IJournalHeader[],
    options: IWriteRepoOptions
  ): Promise<void>;

  findById(
    id: TEntityId,
    options: IReadRepoOptions
  ): Promise<IJournalEntry | null>;
}
