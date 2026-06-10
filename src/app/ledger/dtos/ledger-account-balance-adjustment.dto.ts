import z from 'zod';
import { IJournalEntry } from '../../../domain/journal-entry/types/journal-entry.types';
import { ICorrelationId } from '../../../shared/types/correlation-id.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IMoneyDto, moneyDtoValidation } from '../../shared/dtos/money.dto';

export interface ILedgerAccountBalanceAdjustmentDto extends ICorrelationId {
  journalEntry: Pick<IJournalEntry, 'id' | 'createdBy'>;
  balanceDelta: IMoneyDto;
  functionalBalanceDelta: IMoneyDto;
  ledgerAccountId: TEntityId;
}

export const ledgerAccountBalanceAdjustmentDtoSchema = z.object({
  journalEntry: z.object({
    id: z.uuid(),
    createdBy: z.uuid(),
  }),
  balanceDelta: moneyDtoValidation,
  functionalBalanceDelta: moneyDtoValidation,
  ledgerAccountId: z.uuid(),
});
