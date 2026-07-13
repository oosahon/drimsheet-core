import { IAccountTransaction } from '../../../domain/journal-entry/types/account-transaction.types';
import { IPaginatedResponse } from '../../../shared/pagination/types/pagination.types';
import { IPaginatedReadRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';

export default interface IAccountTransactionQueryRepo {
  findAllByAccountId(
    accountId: TEntityId,
    options: IPaginatedReadRepoOptions
  ): Promise<IPaginatedResponse<IAccountTransaction>>;
}
