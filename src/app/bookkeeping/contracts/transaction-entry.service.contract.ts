import { TAuditedJournalEntry } from '../../../domain/journal-entry/types/journal-entry-audit.types';
import { IjournalEntryMakePayload } from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLineInput } from '../../../domain/journal-entry/types/journal-line.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';

export default interface ITransactionEntryService {
  create(
    source: IJournalLineInput,
    destinations: IJournalLineInput[],
    header: Omit<IjournalEntryMakePayload, 'lines'>,
    repoOptions: IReadRepoOptions
  ): Promise<TAuditedJournalEntry>;
}
