import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { IJournalEntry } from '../types/journal-entry.types';

export default interface IJournalEntryRepo {
  save(
    payload: IJournalEntry | IJournalEntry[],
    options: IRepoOptions
  ): Promise<void>;
}
