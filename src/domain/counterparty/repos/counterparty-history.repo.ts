import { IRepoOptions } from '@shared/types/repo.types';

import { ICounterpartyHistory } from '@domain/counterparty/types/counterparty-audit.types';
import { ICounterparty } from '@domain/counterparty/types/counterparty.types';

export default interface ICounterpartyHistoryRepo {
  save(
    counterparty: ICounterparty,
    history: ICounterpartyHistory,
    options: IRepoOptions
  ): Promise<void>;
}
