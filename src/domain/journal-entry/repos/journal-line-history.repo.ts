import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IJournalLineHistory } from '../types/journal-entry-audit.types';
import { IJournalLine } from '../types/journal-line.types';

export default interface IJournalLineHistoryRepo {
  save(
    lines: IJournalLine | IJournalLine[],
    histories: IJournalLineHistory | IJournalLineHistory[],
    accountingEntityId: TEntityId,
    options: IWriteRepoOptions
  ): Promise<void>;
}
