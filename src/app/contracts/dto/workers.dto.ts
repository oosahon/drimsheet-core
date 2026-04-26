import z from 'zod';
import { IJournalEntry } from '../../../domain/journal-entry/types/journal-entry.types';
import { ICorrelationId } from '../../../shared/types/correlation-id.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IMoneyDto, moneyDtoValidation } from './money.dto';

export interface ILedgerAccountBalanceAdjustmentDto extends ICorrelationId {
  journalEntry: Pick<IJournalEntry, 'id' | 'transactionId' | 'createdBy'>;
  balanceDelta: IMoneyDto;
  functionalBalanceDelta: IMoneyDto;
  ledgerAccountId: TEntityId;
}
export const ledgerAccountBalanceAdjustmentDtoSchema = z.object({
  journalEntry: z.object({
    id: z.uuid(),
    transactionId: z.uuid().nullable(),
    createdBy: z.uuid(),
  }),
  balanceDelta: moneyDtoValidation,
  functionalBalanceDelta: moneyDtoValidation,
  ledgerAccountId: z.uuid(),
});

export interface ITransactionalEmailDto extends ICorrelationId {
  emails: string[];
  subject: string;
  html: string;
  templateId?: string;
  data?: Record<string, string>;
}
export const transactionalEmailDtoSchema = z.object({
  correlationId: z.string().min(1),
  emails: z.array(z.email()),
  subject: z.string().min(3).max(200),
  html: z.string(),
  templateId: z.string().optional(),
  data: z.record(z.string(), z.string()).optional(),
});
