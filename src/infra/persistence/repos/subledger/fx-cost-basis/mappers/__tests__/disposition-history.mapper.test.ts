import { TEntityId } from '@shared/types/uuid';
import { EHistoryActorType } from '@shared/values/history/types/history.types';

import { IFxCostBasisLotDispositionHistory } from '@domain/subledger/fx-cost-basis/types/disposition.types';

import fxCostBasisLotDispositionHistoryMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/disposition-history.mapper';

describe('FX Cost-Basis Lot Disposition History Mapper', () => {
  const dispositionId = 'disposition-1' as TEntityId;
  const accountingEntityId = 'accounting-entity-1' as TEntityId;
  const occurredAt = new Date('2026-08-31T12:00:00.000Z');

  it('maps user history using the created disposition state', () => {
    const userId = 'user-1' as TEntityId;
    const history = {
      entityId: dispositionId,
      action: 'created',
      diff: {
        before: null,
        after: { accountingEntityId },
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id',
    } as unknown as IFxCostBasisLotDispositionHistory;

    expect(fxCostBasisLotDispositionHistoryMapper.toRepo(history)).toEqual({
      dispositionId,
      accountingEntityId,
      actorType: EHistoryActorType.User,
      action: history.action,
      userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: occurredAt.toISOString(),
    });
  });

  it('maps system history using the previous disposition state', () => {
    const history = {
      entityId: dispositionId,
      action: 'created',
      diff: {
        before: { accountingEntityId },
        after: null,
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.System,
        userId: null,
      },
      correlationId: 'correlation-id',
    } as unknown as IFxCostBasisLotDispositionHistory;

    expect(fxCostBasisLotDispositionHistoryMapper.toRepo(history)).toEqual({
      dispositionId,
      accountingEntityId,
      actorType: EHistoryActorType.System,
      action: history.action,
      userId: null,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: occurredAt.toISOString(),
    });
  });

  it('rejects history without an accounting entity ID', () => {
    const history = {
      entityId: dispositionId,
      action: 'created',
      diff: {
        before: null,
        after: {},
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.System,
        userId: null,
      },
      correlationId: 'correlation-id',
    } as unknown as IFxCostBasisLotDispositionHistory;

    expect(() =>
      fxCostBasisLotDispositionHistoryMapper.toRepo(history)
    ).toThrow('repo_error_missing_history_unexpected');
  });
});
