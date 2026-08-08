import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IContractorHistory } from '@domain/counterparty/types/counterparty-audit.types';
import { IContractor } from '@domain/counterparty/types/counterparty.types';

export default interface IContractorRepo {
  create(
    payload: IContractor,
    repoOptions: IWriteRepoOptions<IContractorHistory>
  ): Promise<void>;
}
