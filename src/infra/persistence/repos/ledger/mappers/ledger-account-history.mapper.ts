import { InferSelectModel } from 'drizzle-orm';

import { ILedgerAccountHistory } from '@domain/ledger/types/ledger-account-audit.types';

import { ledgerAccountHistoryInAudit } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

export interface ILedgerAccountHistoryModel extends InferSelectModel<
  typeof ledgerAccountHistoryInAudit
> {}

const ledgerAccountHistoryMapper = {
  toRepo(
    history: ILedgerAccountHistory
  ): Omit<ILedgerAccountHistoryModel, 'id' | 'recordedAt'> {
    return {
      ledgerAccountId: history.entityId,
      accountingEntityId: history.diff.after.accountingEntityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default ledgerAccountHistoryMapper;
