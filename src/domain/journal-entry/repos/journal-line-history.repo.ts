import { IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IJournalLineHistory } from '@domain/journal-entry/types/journal-entry-audit.types';
import { IJournalLine } from '@domain/journal-entry/types/journal-line.types';

export default interface IJournalLineHistoryRepo {
  create(
    lines: IJournalLine | IJournalLine[],
    histories: IJournalLineHistory | IJournalLineHistory[],
    accountingEntityId: TEntityId,
    options: IWriteRepoOptions
  ): Promise<void>;
}
