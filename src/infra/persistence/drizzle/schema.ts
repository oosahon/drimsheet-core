import {
  pgTable,
  serial,
  varchar,
  timestamp,
  pgSchema,
  uuid,
  boolean,
  foreignKey,
  jsonb,
  smallint,
  char,
  numeric,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const audit = pgSchema('audit');
export const core = pgSchema('core');
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
export const contraAccountRuleInCore = core.enum('contra_account_rule', [
  'contra_permitted',
  'contra_not_permitted',
  'contra_only',
  'contra_not_applicable',
]);
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

export const pgmigrations = pgTable('pgmigrations', {
  id: serial().notNull(),
  name: varchar({ length: 255 }).notNull(),
  runOn: timestamp('run_on', { mode: 'string' }).notNull(),
});

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
  password: varchar({ length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
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

export const ledgerAccountsInCore = core.table(
  'ledger_accounts',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    code: varchar({ length: 6 }).notNull(),
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
