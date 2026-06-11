import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import { IPaginatedReadRepoOptions } from '../../../shared/types/repo.types';
import { IJournalLine } from '../types/journal-line.types';

export default interface IJournalLineRepo {
  findAllByAccountId(
    accountId: string,
    options: IPaginatedReadRepoOptions
  ): Promise<IPaginatedResponse<IJournalLine>>;
}
