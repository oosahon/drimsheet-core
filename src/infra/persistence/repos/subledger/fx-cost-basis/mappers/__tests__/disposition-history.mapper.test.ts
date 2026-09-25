import { TEntityId } from '@shared/types/uuid';

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
        after: {
          createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
          accountingEntityId,
        },
      },
      occurredAt,
      actorId: userId,
      onBehalfOf: null,
      correlationId: 'correlation-id',
    } as unknown as IFxCostBasisLotDispositionHistory;

    expect(fxCostBasisLotDispositionHistoryMapper.toRepo(history)).toEqual({
      dispositionId,
      accountingEntityId,
      actorId: userId,
      onBehalfOf: null,
      action: history.action,
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
        before: {
          createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
          accountingEntityId,
        },
        after: null,
      },
      occurredAt,
      actorId: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      onBehalfOf: null,
      correlationId: 'correlation-id',
    } as unknown as IFxCostBasisLotDispositionHistory;

    expect(fxCostBasisLotDispositionHistoryMapper.toRepo(history)).toEqual({
      dispositionId,
      accountingEntityId,
      actorId: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      onBehalfOf: null,
      action: history.action,
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
        after: {
          createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
        },
      },
      occurredAt,
      actorId: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      onBehalfOf: null,
      correlationId: 'correlation-id',
    } as unknown as IFxCostBasisLotDispositionHistory;

    expect(() =>
      fxCostBasisLotDispositionHistoryMapper.toRepo(history)
    ).toThrow('repo_error_missing_history_unexpected');
  });
});
