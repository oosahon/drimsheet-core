import { TEntityId } from '@shared/types/uuid';

import { ILedgerAccountHistory } from '@domain/ledger/types/ledger-account-audit.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';

import ledgerAccountHistoryMapper from '@infra/persistence/repos/ledger/mappers/ledger-account-history.mapper';

describe('ledgerAccountHistoryMapper', () => {
  it('maps a ledger account history record to the repository model', () => {
    const ledgerAccountId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
    const userId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
    const occurredAt = new Date('2026-06-14T00:00:00.000Z');

    const ledgerAccount = {
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      id: ledgerAccountId,
      accountingEntityId,
    } as ILedgerAccount;

    const history: ILedgerAccountHistory = {
      entityId: ledgerAccountId,
      entityVersion: 1,
      action: 'created',
      diff: {
        before: null,
        after: ledgerAccount,
      },
      occurredAt,
      actorId: userId,
      onBehalfOf: null,
      correlationId: 'correlation-id',
    };

    expect(ledgerAccountHistoryMapper.toRepo(history)).toEqual({
      ledgerAccountId,
      accountingEntityId,
      actorId: userId,
      onBehalfOf: null,
      action: history.action,
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
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      id: ledgerAccountId,
      accountingEntityId,
    } as ILedgerAccount;

    const history: ILedgerAccountHistory = {
      entityId: ledgerAccountId,
      entityVersion: 1,
      action: 'created',
      diff: {
        before: null,
        after: ledgerAccount,
      },
      occurredAt,
      actorId: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      onBehalfOf: null,
      correlationId: 'correlation-id',
    };

    expect(ledgerAccountHistoryMapper.toRepo(history)).toEqual({
      ledgerAccountId,
      accountingEntityId,
      actorId: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      onBehalfOf: null,
      action: history.action,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: occurredAt.toISOString(),
    });
  });
});
