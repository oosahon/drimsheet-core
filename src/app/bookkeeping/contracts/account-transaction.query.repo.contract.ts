import { IAccountTransaction } from '../../../domain/bookkeeping/types/account-transaction.types';
import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';

export default interface IAccountTransactionQueryRepo {
  findAllByAccountId(
    accountId: TEntityId,
    options: IRepoOptions
  ): Promise<IPaginatedResponse<IAccountTransaction>>;
}
