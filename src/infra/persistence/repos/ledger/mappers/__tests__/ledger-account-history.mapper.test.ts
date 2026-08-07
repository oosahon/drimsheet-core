import { ILedgerAccountHistory } from '../../../../../../domain/ledger/types/ledger-account-audit.types';
import { ILedgerAccount } from '../../../../../../domain/ledger/types/ledger.types';
import { TEntityId } from '../../../../../../shared/types/uuid';
import { EHistoryActorType } from '../../../../../../shared/values/history/types/history.types';
import ledgerAccountHistoryMapper from '../ledger-account-history.mapper';

describe('ledgerAccountHistoryMapper', () => {
  it('maps a ledger account history record to the repository model', () => {
    const ledgerAccountId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
    const userId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
    const occurredAt = new Date('2026-06-14T00:00:00.000Z');

    const ledgerAccount = {
      id: ledgerAccountId,
      accountingEntityId,
    } as ILedgerAccount;

    const history: ILedgerAccountHistory = {
      entityId: ledgerAccountId,
      action: 'created',
      diff: {
        before: null,
        after: ledgerAccount,
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id',
    };

    expect(ledgerAccountHistoryMapper.toRepo(history)).toEqual({
      ledgerAccountId,
      accountingEntityId,
      actorType: EHistoryActorType.User,
      action: history.action,
      userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: occurredAt.toISOString(),
    });
  });

  it('maps a system-actor history record (userId is null)', () => {
    const ledgerAccountId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
    const occurredAt = new Date('2026-06-14T00:00:00.000Z');

    const ledgerAccount = {
      id: ledgerAccountId,
      accountingEntityId,
    } as ILedgerAccount;

    const history: ILedgerAccountHistory = {
      entityId: ledgerAccountId,
      action: 'created',
      diff: {
        before: null,
        after: ledgerAccount,
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.System,
        userId: null,
      },
      correlationId: 'correlation-id',
    };

    expect(ledgerAccountHistoryMapper.toRepo(history)).toEqual({
      ledgerAccountId,
      accountingEntityId,
      actorType: EHistoryActorType.System,
      action: history.action,
      userId: null,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: occurredAt.toISOString(),
    });
  });
});
