import { IJournalEntry } from '../../../domain/journal-entry/types/journal-entry.types';
import { ICorrelationId } from '../../../shared/types/correlation-id.types';
import { IMoney } from '../../../shared/types/money.types';
import { TEntityId } from '../../../shared/types/uuid';

export interface ILedgerAccountBalanceAdjustmentDto extends ICorrelationId {
  journalEntry: Pick<IJournalEntry, 'id' | 'transactionId' | 'createdBy'>;
  balanceDelta: IMoney;
  functionalBalanceDelta: IMoney;
  ledgerAccountId: TEntityId;
}

export interface ITransactionalEmailDto extends ICorrelationId {
  emails: string[];
  subject: string;
  html: string;
  templateId?: string;
  data?: Record<string, string>;
}
