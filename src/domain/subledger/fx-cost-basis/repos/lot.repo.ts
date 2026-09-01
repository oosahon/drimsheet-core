import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import {
  IFxCostBasisLot,
  IFxCostBasisLotHistory,
} from '@domain/subledger/fx-cost-basis/types/lot.types';

export default interface IFxCostBasisLotRepo {
  findOpenByAccountId(
    accountingEntityId: TEntityId,
    ledgerAccountId: TEntityId,
    options: IReadRepoOptions
  ): Promise<IFxCostBasisLot[]>;

  create(
    payload: IFxCostBasisLot,
    options: IWriteRepoOptions<IFxCostBasisLotHistory>
  ): Promise<void>;

  update(
    payload: IFxCostBasisLot,
    options: IWriteRepoOptions<IFxCostBasisLotHistory>
  ): Promise<void>;
}
