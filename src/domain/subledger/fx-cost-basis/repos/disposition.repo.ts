import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import {
  IFxCostBasisLotDisposition,
  IFxCostBasisLotDispositionHistory,
} from '@domain/subledger/fx-cost-basis/types/disposition.types';

export default interface IFxCostBasisLotDispositionRepo {
  findByJournalEntryId(
    journalEntryId: TEntityId,
    options: IReadRepoOptions
  ): Promise<IFxCostBasisLotDisposition | null>;

  create(
    payload: IFxCostBasisLotDisposition,
    options: IWriteRepoOptions<IFxCostBasisLotDispositionHistory>
  ): Promise<void>;
}
