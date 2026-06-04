import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';

export interface ILedgerAccountService {
  validateAccountAccess(
    accountId: TEntityId,
    userId: TEntityId,
    repoOptions: IRepoOptions
  ): Promise<boolean>;
}
