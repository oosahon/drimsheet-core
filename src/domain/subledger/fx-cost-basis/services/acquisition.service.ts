import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import fxCostBasisLotAcquisitionEntity from '../entities/acquisition.entity';
import fxCostBasisLotEntity from '../entities/lot.entity';
import IFxCostBasisLotAcquisitionService from '../types/acquisition.service.types';
import { IFxCostBasisLotAcquisition } from '../types/acquisition.types';
import { EFxCostBasisLotStatus, IFxCostBasisLot } from '../types/lot.types';

export default function makeFxCostBasisLotAcquisitionService(): IFxCostBasisLotAcquisitionService {
  return {
    create(payload) {
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
