import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { ICounterpartyHistory } from '../types/counterparty-audit.types';
import { ICounterparty } from '../types/counterparty.types';

export default interface ICounterpartyRepo {
  create(
    payload: ICounterparty,
    repoOptions: IWriteRepoOptions<ICounterpartyHistory>
  ): Promise<void>;
}
