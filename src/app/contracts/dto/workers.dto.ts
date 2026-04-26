import { IJournalEntry } from '../../../domain/journal-entry/types/journal-entry.types';
import { ICorrelationId } from '../../../shared/types/correlation-id.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IMoneyDto } from './money.dto';

export interface ILedgerAccountBalanceAdjustmentDto extends ICorrelationId {
  journalEntry: Pick<IJournalEntry, 'id' | 'transactionId' | 'createdBy'>;
  balanceDelta: IMoneyDto;
  functionalBalanceDelta: IMoneyDto;
  ledgerAccountId: TEntityId;
}

export interface ITransactionalEmailDto extends ICorrelationId {
  emails: string[];
  subject: string;
  html: string;
  templateId?: string;
  data?: Record<string, string>;
}
