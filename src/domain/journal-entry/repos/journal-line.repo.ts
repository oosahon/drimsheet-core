import { IPaginatedResponse } from '../../../shared/pagination/types/pagination.types';
import {
  IPaginatedReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IJournalLineHistory } from '../types/journal-entry-audit.types';
import { IJournalLine } from '../types/journal-line.types';

export default interface IJournalLineRepo {
  create(
    payload: IJournalLine | IJournalLine[],
    options: IWriteRepoOptions<IJournalLineHistory | IJournalLineHistory[]> & {
      accountingEntityId: TEntityId;
    }
  ): Promise<void>;

  findAllByAccountId(
    accountId: string,
    options: IPaginatedReadRepoOptions
  ): Promise<IPaginatedResponse<IJournalLine>>;
}
