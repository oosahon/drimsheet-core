import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  char,
  date,
  foreignKey,
  integer,
  jsonb,
  numeric,
  pgSchema,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const audit = pgSchema('audit');
export const core = pgSchema('core');
export const categoryHistoryActionTypeInAudit = audit.enum(
  'category_history_action_type',
  ['created', 'updated', 'archived', 'unarchived']
);
export const accountingEntityTypeInCore = core.enum('accounting_entity_type', [
  'individual',
  'sole_trader',
  'company',
]);
export const adjunctAccountRuleInCore = core.enum('adjunct_account_rule', [
  'adjunct_permitted',
  'adjunct_not_permitted',
  'adjunct_only',
  'adjunct_not_applicable',
]);
export const categoryStatusInCore = core.enum('category_status', [
  'active',
  'archived',
]);
export const contraAccountRuleInCore = core.enum('contra_account_rule', [
  'contra_permitted',
  'contra_not_permitted',
  'contra_only',
  'contra_not_applicable',
]);
export const exchangeRateTypeInCore = core.enum('exchange_rate_type', [
  'official',
  'negotiated',
]);
export const journalEntryStatusInCore = core.enum('journal_entry_status', [
  'draft',
  'posted',
  'voided',
]);
export const journalSideInCore = core.enum('journal_side', ['debit', 'credit']);
export const ledgerAccountBalanceEffectInCore = core.enum(
  'ledger_account_balance_effect',
  ['increase', 'decrease', 'noop']
);
export const ledgerAccountStatusInCore = core.enum('ledger_account_status', [
  'active',
  'archived',
]);
export const ledgerTypeInCore = core.enum('ledger_type', [
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense',
]);
export const normalBalanceTypeInCore = core.enum('normal_balance_type', [
  'debit',
  'credit',
]);
export const transactionStatusInCore = core.enum('transaction_status', [
  'pending',
  'posted',
  'voided',
  'archived',
]);
export const transactionTypesInCore = core.enum('transaction_types', [
  'sale',
  'purchase',
  'credit_note',
  'debit_note',
  'expense',
  'transfer',
  'payment',
  'receipt',
]);

export const pgmigrations = pgTable('pgmigrations', {
  id: serial().notNull(),
  name: varchar({ length: 255 }).notNull(),
  runOn: timestamp('run_on', { mode: 'string' }).notNull(),
});

export const userActivitiesInAudit = audit.table(
  'user_activities',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    userId: uuid('user_id'),
    eventKey: varchar('event_key', { length: 150 }).notNull(),
    description: varchar({ length: 100 }).notNull(),
    meta: jsonb(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [usersInCore.id],
      name: 'user_activities_user_id_fkey',
    }).onDelete('cascade'),
  ]
);

export const seeds = pgTable('seeds', {
  id: serial().notNull(),
  fileName: varchar('file_name', { length: 250 }).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
});

export const usersInCore = core.table('users', {
  id: uuid()
    .default(sql`uuid_generate_v4()`)
    .notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar({ length: 200 }).notNull(),
  emailVerified: boolean('email_verified').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
});

export const userAuthInCore = core.table(
  'user_auth',
  {
    userId: uuid('user_id').notNull(),
    password: varchar({ length: 200 }),
    failedLoginAttempts: integer('failed_login_attempts').default(0),
    strategies: varchar({ length: 50 }).array().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [usersInCore.id],
      name: 'user_auth_user_id_fkey',
    }).onDelete('cascade'),
  ]
);

export const userSessionsInCore = core.table(
  'user_sessions',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    userId: uuid('user_id').notNull(),
    refreshToken: text('refresh_token').notNull(),
    lastLoginAt: timestamp('last_login_at', {
      withTimezone: true,
      mode: 'string',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_sessions_user_id_refresh_token_unique_index').using(
      'btree',
      table.userId.asc().nullsLast().op('text_ops'),
      table.refreshToken.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [usersInCore.id],
      name: 'user_sessions_user_id_fkey',
    }).onDelete('cascade'),
  ]
);

export const currenciesInCore = core.table('currencies', {
  code: char({ length: 3 }).notNull(),
  symbol: varchar({ length: 5 }).notNull(),
  name: varchar({ length: 50 }).notNull(),
  minorUnit: smallint('minor_unit').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
});

export const currencyExchangeRatesInCore = core.table(
  'currency_exchange_rates',
  {
    baseCurrencyCode: char('base_currency_code', { length: 3 }).notNull(),
    targetCurrencyCode: char('target_currency_code', { length: 3 }).notNull(),
    rate: numeric({ precision: 20, scale: 10 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.baseCurrencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'currency_exchange_rates_base_currency_code_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.targetCurrencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'currency_exchange_rates_target_currency_code_fkey',
    }).onDelete('cascade'),
  ]
);

export const accountingEntitiesInCore = core.table(
  'accounting_entities',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    type: accountingEntityTypeInCore().notNull(),
    name: varchar({ length: 255 }).notNull(),
    operatingCountryCode: varchar('operating_country_code', {
      length: 2,
    }).notNull(),
    ownerId: uuid('owner_id').notNull(),
    functionalCurrencyCode: varchar('functional_currency_code', {
      length: 3,
    }).notNull(),
    reportingCurrencyCode: varchar('reporting_currency_code', {
      length: 3,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    fiscalYearStartMonth: smallint('fiscal_year_start_month').notNull(),
    fiscalYearStartDay: smallint('fiscal_year_start_day').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [usersInCore.id],
      name: 'accounting_entities_owner_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.functionalCurrencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'accounting_entities_functional_currency_code_fkey',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.reportingCurrencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'accounting_entities_reporting_currency_code_fkey',
    }).onDelete('restrict'),
  ]
);

export const ledgerAccountsInCore = core.table(
  'ledger_accounts',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    code: varchar({ length: 6 }).notNull(),
    materializedPath: varchar('materialized_path', { length: 100 }).notNull(),
    accountingEntityId: uuid('accounting_entity_id').notNull(),
    type: ledgerTypeInCore().notNull(),
    normalBalance: normalBalanceTypeInCore('normal_balance').notNull(),
    subType: varchar('sub_type').notNull(),
    behavior: varchar().notNull(),
    isControlAccount: boolean('is_control_account').default(false).notNull(),
    controlAccountId: uuid('control_account_id'),
    name: varchar({ length: 100 }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    status: ledgerAccountStatusInCore().notNull(),
    contraAccountRule: contraAccountRuleInCore('contra_account_rule').notNull(),
    adjunctAccountRule: adjunctAccountRuleInCore(
      'adjunct_account_rule'
    ).notNull(),
    meta: jsonb(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.accountingEntityId],
      foreignColumns: [accountingEntitiesInCore.id],
      name: 'ledger_accounts_accounting_entity_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.controlAccountId],
      foreignColumns: [table.id],
      name: 'ledger_accounts_control_account_id_fkey',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.currencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'ledger_accounts_currency_code_fkey',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [usersInCore.id],
      name: 'ledger_accounts_created_by_fkey',
    }).onDelete('cascade'),
  ]
);

export const userPreferencesInCore = core.table(
  'user_preferences',
  {
    id: uuid().notNull(),
    appPreferences: jsonb('app_preferences'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [usersInCore.id],
      name: 'user_preferences_id_fkey',
    }).onDelete('cascade'),
  ]
);

export const categoriesInCore = core.table(
  'categories',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    accountingEntityId: uuid('accounting_entity_id').notNull(),
    accountId: uuid('account_id').notNull(),
    accountMaterializedPath: varchar('account_materialized_path', {
      length: 100,
    }).notNull(),
    version: integer().default(1).notNull(),
    status: categoryStatusInCore().notNull(),
    name: varchar({ length: 100 }).notNull(),
    isGrouping: boolean('is_grouping').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.accountingEntityId],
      foreignColumns: [accountingEntitiesInCore.id],
      name: 'categories_accounting_entity_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [ledgerAccountsInCore.id],
      name: 'categories_account_id_fkey',
    }).onDelete('cascade'),
  ]
);

export const categoryHistoryInAudit = audit.table(
  'category_history',
  {
    id: bigserial({ mode: 'bigint' }).notNull(),
    categoryId: uuid('category_id').notNull(),
    userId: uuid('user_id').notNull(),
    action: categoryHistoryActionTypeInAudit().notNull(),
    diff: jsonb().notNull(),
    note: varchar({ length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categoriesInCore.id],
      name: 'category_history_category_id_fkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [usersInCore.id],
      name: 'category_history_user_id_fkey',
    }),
  ]
);

export const transactionsInCore = core.table(
  'transactions',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    accountingEntityId: uuid('accounting_entity_id').notNull(),
    reference: varchar({ length: 100 }).notNull(),
    type: transactionTypesInCore().notNull(),
    effectiveDate: date('effective_date').notNull(),
    createdBy: uuid('created_by').notNull(),
    sourceAccountId: uuid('source_account_id').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    amount: bigint({ mode: 'number' }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    exchangeRate: jsonb('exchange_rate').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    functionalAmount: bigint('functional_amount', { mode: 'number' }).notNull(),
    notes: varchar({ length: 100 }),
    version: integer().default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.accountingEntityId],
      foreignColumns: [accountingEntitiesInCore.id],
      name: 'transactions_accounting_entity_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [usersInCore.id],
      name: 'transactions_created_by_fkey',
    }),
    foreignKey({
      columns: [table.sourceAccountId],
      foreignColumns: [ledgerAccountsInCore.id],
      name: 'transactions_source_account_id_fkey',
    }),
    foreignKey({
      columns: [table.currencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'transactions_currency_code_fkey',
    }),
  ]
);

export const transactionLinesInCore = core.table(
  'transaction_lines',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    transactionId: uuid('transaction_id').notNull(),
    targetAccountId: uuid('target_account_id').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    amount: bigint({ mode: 'number' }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    functionalAmount: bigint('functional_amount', { mode: 'number' }).notNull(),
    description: varchar({ length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactionsInCore.id],
      name: 'transaction_lines_transaction_id_fkey',
    }),
    foreignKey({
      columns: [table.targetAccountId],
      foreignColumns: [ledgerAccountsInCore.id],
      name: 'transaction_lines_target_account_id_fkey',
    }),
    foreignKey({
      columns: [table.currencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'transaction_lines_currency_code_fkey',
    }),
  ]
);

export const journalEntriesInCore = core.table(
  'journal_entries',
  {
    id: uuid().notNull(),
    accountingEntityId: uuid('accounting_entity_id').notNull(),
    transactionId: uuid('transaction_id'),
    memo: varchar({ length: 100 }),
    status: journalEntryStatusInCore().notNull(),
    effectiveDate: date('effective_date').notNull(),
    postedAt: timestamp('posted_at', { withTimezone: true, mode: 'string' }),
    voidedAt: timestamp('voided_at', { withTimezone: true, mode: 'string' }),
    voidingEntryId: uuid('voiding_entry_id'),
    version: integer().default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.accountingEntityId],
      foreignColumns: [accountingEntitiesInCore.id],
      name: 'journal_entries_accounting_entity_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactionsInCore.id],
      name: 'journal_entries_transaction_id_fkey',
    }),
    foreignKey({
      columns: [table.voidingEntryId],
      foreignColumns: [table.id],
      name: 'journal_entries_voiding_entry_id_fkey',
    }),
  ]
);

export const journalLinesInCore = core.table(
  'journal_lines',
  {
    id: uuid().notNull(),
    entryId: uuid('entry_id').notNull(),
    accountId: uuid('account_id').notNull(),
    sequenceOrder: integer('sequence_order').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    amount: bigint({ mode: 'number' }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    exchangeRate: jsonb('exchange_rate'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    functionalAmount: bigint('functional_amount', { mode: 'number' }).notNull(),
    side: journalSideInCore().notNull(),
    description: varchar({ length: 100 }),
    meta: jsonb(),
    version: integer().default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.entryId],
      foreignColumns: [journalEntriesInCore.id],
      name: 'journal_lines_entry_id_fkey',
    }),
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [ledgerAccountsInCore.id],
      name: 'journal_lines_account_id_fkey',
    }),
    foreignKey({
      columns: [table.currencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'journal_lines_currency_code_fkey',
    }),
  ]
);

export const exchangeRatesInCore = core.table('exchange_rates', {
  id: bigserial({ mode: 'bigint' }).notNull(),
  currencyPair: varchar('currency_pair', { length: 7 }).notNull(),
  baseCurrencyCode: varchar('base_currency_code', { length: 3 }).notNull(),
  targetCurrencyCode: varchar('target_currency_code', { length: 3 }).notNull(),
  rate: numeric().notNull(),
  type: exchangeRateTypeInCore().notNull(),
  asOf: date('as_of').notNull(),
  source: varchar({ length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const ledgerAccountBalancesInCore = core.table(
  'ledger_account_balances',
  {
    ledgerAccountId: uuid('ledger_account_id').notNull(),
    accountingEntityId: uuid('accounting_entity_id').notNull(),
    accountMaterializedPath: varchar('account_materialized_path', {
      length: 100,
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    amount: bigint({ mode: 'number' }).default(0).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    functionalAmount: bigint('functional_amount', { mode: 'number' })
      .default(0)
      .notNull(),
    functionalCurrencyCode: varchar('functional_currency_code', {
      length: 3,
    }).notNull(),
    version: integer().default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.ledgerAccountId],
      foreignColumns: [ledgerAccountsInCore.id],
      name: 'ledger_account_balances_ledger_account_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.accountingEntityId],
      foreignColumns: [accountingEntitiesInCore.id],
      name: 'ledger_account_balances_accounting_entity_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.currencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'ledger_account_balances_currency_code_fkey',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.functionalCurrencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'ledger_account_balances_functional_currency_code_fkey',
    }).onDelete('restrict'),
  ]
);

export const ledgerAccountBalanceAdjustmentsInCore = core.table(
  'ledger_account_balance_adjustments',
  {
    id: uuid().defaultRandom().notNull(),
    ledgerAccountId: uuid('ledger_account_id').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    amount: bigint({ mode: 'number' }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    functionalAmount: bigint('functional_amount', { mode: 'number' }).notNull(),
    functionalCurrencyCode: varchar('functional_currency_code', {
      length: 3,
    }).notNull(),
    journalEntryId: uuid('journal_entry_id').notNull(),
    transactionId: uuid('transaction_id'),
    effect: ledgerAccountBalanceEffectInCore().notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.ledgerAccountId],
      foreignColumns: [ledgerAccountsInCore.id],
      name: 'ledger_account_balance_adjustments_ledger_account_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.currencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'ledger_account_balance_adjustments_currency_code_fkey',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.functionalCurrencyCode],
      foreignColumns: [currenciesInCore.code],
      name: 'ledger_account_balance_adjustment_functional_currency_code_fkey',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.journalEntryId],
      foreignColumns: [journalEntriesInCore.id],
      name: 'ledger_account_balance_adjustments_journal_entry_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactionsInCore.id],
      name: 'ledger_account_balance_adjustments_transaction_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [usersInCore.id],
      name: 'ledger_account_balance_adjustments_created_by_fkey',
    }).onDelete('cascade'),
  ]
);
