import z from 'zod';
import { moneyDtoValidation } from '../../../shared/dtos/money/money.dto.validation';

export const ledgerAccountBalanceAdjustmentDtoSchema = z.object({
  journalEntry: z.object({
    id: z.uuid(),
    createdBy: z.uuid(),
  }),
  balanceDelta: moneyDtoValidation,
  functionalBalanceDelta: moneyDtoValidation,
  ledgerAccountId: z.uuid(),
});
