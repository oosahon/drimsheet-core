import { IAccountingContextHistory } from '../../../../../domain/accounting/types/accounting-context-audit.types';
import { IAccountingContext } from '../../../../../domain/accounting/types/context.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { EHistoryActorType } from '../../../../../shared/values/history/types/history.types';
import accountingContextHistoryMapper from '../accounting-context-history.mapper';

describe('accountingContextHistoryMapper', () => {
  it('maps accounting context history to the repository model', () => {
    const accountingContextId =
      '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
    const userId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
    const occurredAt = new Date('2026-06-14T00:00:00.000Z');
    const accountingContext = {
      accountingEntityId,
    } as IAccountingContext;
    const history: IAccountingContextHistory = {
      entityId: accountingContextId,
      action: 'created',
      diff: {
        before: null,
        after: accountingContext,
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id',
    };

    expect(
      accountingContextHistoryMapper.toRepo(accountingContext, history)
    ).toEqual({
      accountingContextId,
      accountingEntityId,
      actorType: EHistoryActorType.User,
      action: history.action,
      userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: occurredAt.toISOString(),
    });
  });
});
