import { IReadRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import {
  IFxLotAppOperationPayload,
  TFxLotAcquisitionAppResult,
  TFxLotDispositionAppResult,
  TFxLotReversalAppResult,
} from '@app/subledger/fx-cost-basis/types/fx-lot.service.types';

export default interface IFxLotAppService {
  reverse(
    journalEntryId: TEntityId,
    actor: IFxLotAppOperationPayload['actor'],
    repoOptions: IReadRepoOptions
  ): Promise<TFxLotReversalAppResult | null>;

  acquire(
    payload: IFxLotAppOperationPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TFxLotAcquisitionAppResult | null>;

  dispose(
    payload: IFxLotAppOperationPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TFxLotDispositionAppResult | null>;
}
