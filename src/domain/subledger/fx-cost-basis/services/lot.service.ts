import { TCreationOmits } from '@shared/types/creation-omits.types';

import fxCostBasisLotAcquisitionEntity from '@domain/subledger/fx-cost-basis/entities/acquisition.entity';
import fxCostBasisLotEntity from '@domain/subledger/fx-cost-basis/entities/lot.entity';
import { IFxCostBasisLotAcquisition } from '@domain/subledger/fx-cost-basis/types/acquisition.types';
import IFxCostBasisLotDomainService from '@domain/subledger/fx-cost-basis/types/lot.service.types';
import {
  EFxCostBasisLotStatus,
  IFxCostBasisLot,
} from '@domain/subledger/fx-cost-basis/types/lot.types';

export default function makeFxCostBasisLotService(): IFxCostBasisLotDomainService {
  return {
    acquire(payload) {
      const lotPayload: TCreationOmits<IFxCostBasisLot, 'version'> = {
        ledgerAccountId: payload.ledgerAccountId,
        accountingEntityId: payload.accountingEntityId,
        status: EFxCostBasisLotStatus.Open,
        originalQuantity: payload.quantity,
        remainingQuantity: payload.quantity,
        costBasis: payload.costBasis,
        remainingCostBasis: payload.costBasis,
        acquisitionRate: payload.acquisitionRate,
        acquisitionDate: payload.acquisitionDate,
      };

      const lot = fxCostBasisLotEntity.make(lotPayload);

      const acquisitionPayload: TCreationOmits<IFxCostBasisLotAcquisition> = {
        ledgerAccountId: payload.ledgerAccountId,
        accountingEntityId: payload.accountingEntityId,
        lotId: lot[0].id,
        journalEntryId: payload.journalEntryId,
        quantity: payload.quantity,
        costBasis: payload.costBasis,
        acquisitionRate: payload.acquisitionRate,
        acquisitionDate: payload.acquisitionDate,
        officialRate: payload.officialRate,
      };

      const acquisition =
        fxCostBasisLotAcquisitionEntity.make(acquisitionPayload);

      return { lot, acquisition };
    },
  };
}
