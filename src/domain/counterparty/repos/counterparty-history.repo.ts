import { IRepoOptions } from '../../../shared/types/repo.types';
import { ICounterpartyHistory } from '../types/counterparty-audit.types';
import { ICounterparty } from '../types/counterparty.types';

export default interface ICounterpartyHistoryRepo {
  save(
    counterparty: ICounterparty,
    history: ICounterpartyHistory,
    options: IRepoOptions
  ): Promise<void>;
}
