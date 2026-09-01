import generateDiff from '@shared/utils/diff-generator';

import {
  IFxCostBasisLotDispositionAudit,
  IMakeFxCostBasisLotDispositionAuditPayload,
} from '@domain/subledger/fx-cost-basis/types/disposition.types';

function make(
  payload: IMakeFxCostBasisLotDispositionAuditPayload
): IFxCostBasisLotDispositionAudit {
  const { before, after } = generateDiff(payload.after, payload.before);

  return Object.freeze({
    entityId: payload.after.id,
    entityVersion: 1,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.createdAt,
  });
}

const fxCostBasisLotDispositionAudit = Object.freeze({
  make,
});

export default fxCostBasisLotDispositionAudit;
