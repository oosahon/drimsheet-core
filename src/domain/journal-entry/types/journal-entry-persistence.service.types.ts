import { IHistoryActor } from '../../../shared/types/history.types';
import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IJournalEntryCreationAudit } from './journal-entry-audit.types';
import { IJournalEntry } from './journal-entry.types';

export default interface IJournalEntryPersistenceService {
  save(
    entry: IJournalEntry,
    audit: IJournalEntryCreationAudit,
    actor: IHistoryActor,
    options: IWriteRepoOptions
  ): Promise<void>;
}
