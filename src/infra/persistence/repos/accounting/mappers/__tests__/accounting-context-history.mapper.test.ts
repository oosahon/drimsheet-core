import { TEntityId } from '@shared/types/uuid';

import { IAccountingContextHistory } from '@domain/accounting/types/accounting-context-audit.types';
import { IAccountingContext } from '@domain/accounting/types/context.types';

import accountingContextHistoryMapper from '@infra/persistence/repos/accounting/mappers/accounting-context-history.mapper';

describe('accountingContextHistoryMapper', () => {
  it('maps accounting context history to the repository model', () => {
    const accountingContextId =
      '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
    const userId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
    const occurredAt = new Date('2026-06-14T00:00:00.000Z');
    const accountingContext = {
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      accountingEntityId,
    } as IAccountingContext;
    const history: IAccountingContextHistory = {
      entityId: accountingContextId,
      entityVersion: 1,
      action: 'created',
      diff: {
        before: null,
        after: accountingContext,
      },
      occurredAt,
      actorId: userId,
      onBehalfOf: null,
      correlationId: 'correlation-id',
    };

    expect(
      accountingContextHistoryMapper.toRepo(accountingContext, history)
    ).toEqual({
      accountingContextId,
      accountingEntityId,
      actorId: userId,
      onBehalfOf: null,
      action: history.action,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: occurredAt.toISOString(),
    });
  });
});
