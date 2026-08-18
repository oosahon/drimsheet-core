import { ICorrelationId } from '@shared/types/correlation-id.types';
import { TEntityId } from '@shared/types/uuid';

export interface ILedgerAccountBalanceAdjustmentDto extends ICorrelationId {
  journalEntryId: TEntityId;
}
