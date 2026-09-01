import generateDiff from '@shared/utils/diff-generator';

import {
  IFxCostBasisLotAudit,
  IMakeFxCostBasisLotAuditPayload,
} from '@domain/subledger/fx-cost-basis/types/lot.types';

function make(payload: IMakeFxCostBasisLotAuditPayload): IFxCostBasisLotAudit {
  const { before, after } = generateDiff(payload.after, payload.before);

  return Object.freeze({
    entityId: payload.after.id,
    entityVersion: payload.after.version,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.updatedAt,
  });
}

const fxCostBasisLotAudit = Object.freeze({
  make,
});

export default fxCostBasisLotAudit;
