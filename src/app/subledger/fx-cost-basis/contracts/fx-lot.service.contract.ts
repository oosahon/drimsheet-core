import { IReadRepoOptions } from '@shared/types/repo.types';

import {
  IFxLotAppOperationPayload,
  TFxLotAcquisitionAppResult,
  TFxLotDispositionAppResult,
} from '@app/subledger/fx-cost-basis/types/fx-lot.service.types';

export default interface IFxLotAppService {
  acquire(
    payload: IFxLotAppOperationPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TFxLotAcquisitionAppResult | null>;

  dispose(
    payload: IFxLotAppOperationPayload,
    repoOptions: IReadRepoOptions
  ): Promise<TFxLotDispositionAppResult | null>;
}
