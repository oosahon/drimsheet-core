import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import {
  IFxCostBasisLotAcquisition,
  IFxCostBasisLotAcquisitionHistory,
} from '@domain/subledger/fx-cost-basis/types/acquisition.types';

export default interface IFxCostBasisLotAcquisitionRepo {
  findByJournalEntryId(
    journalEntryId: TEntityId,
    options: IReadRepoOptions
  ): Promise<IFxCostBasisLotAcquisition | null>;

  create(
    payload: IFxCostBasisLotAcquisition,
    options: IWriteRepoOptions<IFxCostBasisLotAcquisitionHistory>
  ): Promise<void>;
}
