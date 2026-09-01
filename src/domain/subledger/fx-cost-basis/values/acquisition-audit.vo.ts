import generateDiff from '@shared/utils/diff-generator';

import {
  IFxCostBasisLotAcquisitionAudit,
  IMakeFxCostBasisLotAcquisitionAuditPayload,
} from '@domain/subledger/fx-cost-basis/types/acquisition.types';

function make(
  payload: IMakeFxCostBasisLotAcquisitionAuditPayload
): IFxCostBasisLotAcquisitionAudit {
  const { before, after } = generateDiff(payload.after, payload.before);

  return Object.freeze({
    entityId: payload.after.id,
    entityVersion: 1,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.createdAt,
  });
}

const fxCostBasisLotAcquisitionAudit = Object.freeze({
  make,
});

export default fxCostBasisLotAcquisitionAudit;
