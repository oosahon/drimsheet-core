import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IContractorHistory } from '../types/counterparty-audit.types';
import { IContractor } from '../types/counterparty.types';

export default interface IContractorRepo {
  create(
    payload: IContractor,
    repoOptions: IWriteRepoOptions<IContractorHistory>
  ): Promise<void>;
}
