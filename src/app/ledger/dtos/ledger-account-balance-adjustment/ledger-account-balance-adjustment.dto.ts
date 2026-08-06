import { IJournalEntry } from '../../../../domain/journal-entry/types/journal-entry.types';
import { ICorrelationId } from '../../../../shared/types/correlation-id.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { IMoneyDto } from '../../../money/dtos/money/money.dto';

export interface ILedgerAccountBalanceAdjustmentDto extends ICorrelationId {
  journalEntry: Pick<IJournalEntry, 'id' | 'createdBy'>;
  accountingEntityId: TEntityId;
  balanceDelta: IMoneyDto;
  functionalBalanceDelta: IMoneyDto;
  ledgerAccountId: TEntityId;
}
