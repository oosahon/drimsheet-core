import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IEmployerHistory } from '../types/counterparty-audit.types';
import { IEmployer } from '../types/counterparty.types';

export default interface IEmployerRepo {
  create(
    payload: IEmployer,
    repoOptions: IWriteRepoOptions<IEmployerHistory>
  ): Promise<void>;
}
