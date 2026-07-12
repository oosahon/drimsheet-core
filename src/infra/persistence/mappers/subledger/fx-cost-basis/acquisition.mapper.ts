import { InferSelectModel } from 'drizzle-orm';
import { IFxCostBasisLotAcquisition } from '../../../../../domain/subledger/fx-cost-basis/types/acquisition.types';
import { subledgerFxCostBasisLotAcquisitionsInCore } from '../../../../config/drizzle/schema';
import { toRepoDate, toRepoDateOnly } from '../../shared/date';

export interface IFxCostBasisLotAcquisitionModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotAcquisitionsInCore
> {}

const fxCostBasisLotAcquisitionMapper = {
  toRepo(payload: IFxCostBasisLotAcquisition): IFxCostBasisLotAcquisitionModel {
    return {
      id: payload.id,
      ledgerAccountId: payload.ledgerAccountId,
      accountingEntityId: payload.accountingEntityId,
      lotId: payload.lotId,
      journalEntryId: payload.journalEntryId,
      quantityAmount: Number(payload.quantity.amount),
      quantityCurrency: payload.quantity.currency.code,
      costBasisAmount: Number(payload.costBasis.amount),
      costBasisCurrency: payload.costBasis.currency.code,
      acquisitionRate: payload.acquisitionRate,
      acquisitionDate: toRepoDateOnly(payload.acquisitionDate),
      officialRate: payload.officialRate,
      createdAt: toRepoDate(payload.createdAt),
    };
  },
};

export default fxCostBasisLotAcquisitionMapper;
