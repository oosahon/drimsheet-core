import z from 'zod';

import { moneyDtoValidation } from '@app/money/dtos/money/money.dto.validation';

export const ledgerAccountBalanceAdjustmentDtoSchema = z.object({
  journalEntry: z.object({
    id: z.uuid(),
    createdBy: z.uuid(),
  }),
  accountingEntityId: z.uuid(),
  balanceDelta: moneyDtoValidation,
  functionalBalanceDelta: moneyDtoValidation,
  ledgerAccountId: z.uuid(),
});
