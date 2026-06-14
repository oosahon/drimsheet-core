import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import {
  IPaginatedReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { IJournalLine } from '../types/journal-line.types';

export default interface IJournalLineRepo {
  save(
    payload: IJournalLine | IJournalLine[],
    options: IWriteRepoOptions
  ): Promise<void>;

  findAllByAccountId(
    accountId: string,
    options: IPaginatedReadRepoOptions
  ): Promise<IPaginatedResponse<IJournalLine>>;
}
