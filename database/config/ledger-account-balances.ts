import { coreSchema } from './schemas';

export const ledgerAccountBalancesTable = {
  name: 'ledger_account_balances',
  schema: coreSchema,
};

export const ledgerAccountBalanceAdjustmentsTable = {
  name: 'ledger_account_balance_adjustments',
  schema: coreSchema,
};

export const ledgerAccountBalanceEffectType = {
  name: 'ledger_account_balance_effect',
  schema: coreSchema,
};
