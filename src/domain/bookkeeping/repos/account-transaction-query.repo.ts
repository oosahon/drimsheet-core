import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IAccountTransaction } from '../types/account-transaction.types';

export default interface IAccountTransactionQueryRepo {
  findAllByAccountId(
    accountId: TEntityId,
    options: IRepoOptions
  ): Promise<IPaginatedResponse<IAccountTransaction>>;
}
