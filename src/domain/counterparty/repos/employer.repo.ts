import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IEmployerHistory } from '@domain/counterparty/types/counterparty-audit.types';
import { IEmployer } from '@domain/counterparty/types/counterparty.types';

export default interface IEmployerRepo {
  create(
    payload: IEmployer,
    repoOptions: IWriteRepoOptions<IEmployerHistory>
  ): Promise<void>;
}
