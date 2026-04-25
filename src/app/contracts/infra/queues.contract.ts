import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import { ICorrelationId } from '../../../shared/types/correlation-id.types';

export interface ITransactionalEmailPayload extends ICorrelationId {
  emails: string[];
  subject: string;
  html: string;
  templateId?: string;
  data?: Record<string, string>;
}

export interface ILedgerAccountBalanceAdjustmentPayload
  extends ICorrelationId, ILedgerAccount {}

export interface IQueue {
  addTransactionalEmail(payload: ITransactionalEmailPayload): void;

  addLedgerAccountBalanceAdjustment(
    payload: ILedgerAccountBalanceAdjustmentPayload
  ): void;
}
