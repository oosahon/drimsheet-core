import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IJournalEntryHistory } from '../types/journal-entry-audit.types';
import { IJournalHeader } from '../types/journal-entry.types';

export default interface IJournalEntryHistoryRepo {
  create(
    header: IJournalHeader | IJournalHeader[],
    history: IJournalEntryHistory | IJournalEntryHistory[],
    options: IWriteRepoOptions
  ): Promise<void>;
}
