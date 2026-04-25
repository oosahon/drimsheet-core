import { ICorrelationId } from '../../../shared/types/correlation-id.types';
import { INewLedgerAccountBalanceAndAdjustmentModel } from '../../mappers/ledger-account-balance.mapper';

export interface ITransactionalEmailPayload extends ICorrelationId {
  emails: string[];
  subject: string;
  html: string;
  templateId?: string;
  data?: Record<string, string>;
}

export interface ILedgerAccountBalanceAdjustmentPayload
  extends ICorrelationId, INewLedgerAccountBalanceAndAdjustmentModel {}

export interface IQueue {
  addTransactionalEmail(payload: ITransactionalEmailPayload): void;

  addLedgerAccountBalanceAdjustment(
    payload: ILedgerAccountBalanceAdjustmentPayload
  ): void;
}
