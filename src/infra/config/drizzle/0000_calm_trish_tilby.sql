-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE TYPE "audit"."category_history_action_type" AS ENUM('created', 'updated', 'archived', 'unarchived');--> statement-breakpoint
CREATE TYPE "core"."accounting_entity_type" AS ENUM('individual', 'sole_trader', 'company');--> statement-breakpoint
CREATE TYPE "core"."adjunct_account_rule" AS ENUM('adjunct_permitted', 'adjunct_not_permitted', 'adjunct_only', 'adjunct_not_applicable');--> statement-breakpoint
CREATE TYPE "core"."category_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "core"."contra_account_rule" AS ENUM('contra_permitted', 'contra_not_permitted', 'contra_only', 'contra_not_applicable');--> statement-breakpoint
CREATE TYPE "core"."exchange_rate_type" AS ENUM('official', 'negotiated');--> statement-breakpoint
CREATE TYPE "core"."journal_entry_status" AS ENUM('draft', 'posted', 'voided');--> statement-breakpoint
CREATE TYPE "core"."journal_side" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "core"."ledger_account_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "core"."ledger_type" AS ENUM('asset', 'liability', 'equity', 'revenue', 'expense');--> statement-breakpoint
CREATE TYPE "core"."normal_balance_type" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "core"."transaction_status" AS ENUM('pending', 'posted', 'voided', 'archived');--> statement-breakpoint
CREATE TYPE "core"."transaction_types" AS ENUM('sale', 'purchase', 'credit_note', 'debit_note', 'expense', 'transfer', 'payment', 'receipt');--> statement-breakpoint
CREATE TABLE "pgmigrations" (
	"id" serial NOT NULL,
	"name" varchar(255) NOT NULL,
	"run_on" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."exchange_rates" (
	"id" bigserial NOT NULL,
	"currency_pair" varchar(7) NOT NULL,
	"base_currency_code" varchar(3) NOT NULL,
	"target_currency_code" varchar(3) NOT NULL,
	"rate" numeric NOT NULL,
	"type" "core"."exchange_rate_type" NOT NULL,
	"as_of" date NOT NULL,
	"source" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."users" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(200) NOT NULL,
	"email_verified" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."user_auth" (
	"user_id" uuid NOT NULL,
	"password" varchar(200),
	"failed_login_attempts" integer DEFAULT 0,
	"strategies" varchar(50)[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seeds" (
	"id" serial NOT NULL,
	"file_name" varchar(250) NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."user_sessions" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token" text NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit"."user_activities" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid,
	"event_key" varchar(150) NOT NULL,
	"description" varchar(100) NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."currencies" (
	"code" char(3) NOT NULL,
	"symbol" varchar(5) NOT NULL,
	"name" varchar(50) NOT NULL,
	"minor_unit" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."currency_exchange_rates" (
	"base_currency_code" char(3) NOT NULL,
	"target_currency_code" char(3) NOT NULL,
	"rate" numeric(20, 10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."accounting_entities" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"type" "core"."accounting_entity_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"operating_country_code" varchar(2) NOT NULL,
	"owner_id" uuid NOT NULL,
	"functional_currency_code" varchar(3) NOT NULL,
	"reporting_currency_code" varchar(3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fiscal_year_start_month" smallint NOT NULL,
	"fiscal_year_start_day" smallint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."ledger_accounts" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"code" varchar(6) NOT NULL,
	"materialized_path" varchar(100) NOT NULL,
	"accounting_entity_id" uuid NOT NULL,
	"type" "core"."ledger_type" NOT NULL,
	"normal_balance" "core"."normal_balance_type" NOT NULL,
	"sub_type" varchar NOT NULL,
	"behavior" varchar NOT NULL,
	"is_control_account" boolean DEFAULT false NOT NULL,
	"control_account_id" uuid,
	"name" varchar(100) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"status" "core"."ledger_account_status" NOT NULL,
	"contra_account_rule" "core"."contra_account_rule" NOT NULL,
	"adjunct_account_rule" "core"."adjunct_account_rule" NOT NULL,
	"meta" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."user_preferences" (
	"id" uuid NOT NULL,
	"app_preferences" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."categories" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"accounting_entity_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"account_materialized_path" varchar(100) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "core"."category_status" NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_grouping" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit"."category_history" (
	"id" bigserial NOT NULL,
	"category_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "audit"."category_history_action_type" NOT NULL,
	"diff" jsonb NOT NULL,
	"note" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."transactions" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"accounting_entity_id" uuid NOT NULL,
	"reference" varchar(100) NOT NULL,
	"type" "core"."transaction_types" NOT NULL,
	"effective_date" date NOT NULL,
	"created_by" uuid NOT NULL,
	"source_account_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"exchange_rate" jsonb NOT NULL,
	"functional_amount" bigint NOT NULL,
	"notes" varchar(100),
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."transaction_lines" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"target_account_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"functional_amount" bigint NOT NULL,
	"description" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."journal_entries" (
	"id" uuid NOT NULL,
	"accounting_entity_id" uuid NOT NULL,
	"transaction_id" uuid,
	"memo" varchar(100),
	"status" "core"."journal_entry_status" NOT NULL,
	"effective_date" date NOT NULL,
	"posted_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"voiding_entry_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."journal_lines" (
	"id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"sequence_order" integer NOT NULL,
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"exchange_rate" jsonb,
	"functional_amount" bigint NOT NULL,
	"side" "core"."journal_side" NOT NULL,
	"description" varchar(100),
	"meta" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."user_auth" ADD CONSTRAINT "user_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit"."user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."currency_exchange_rates" ADD CONSTRAINT "currency_exchange_rates_base_currency_code_fkey" FOREIGN KEY ("base_currency_code") REFERENCES "core"."currencies"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."currency_exchange_rates" ADD CONSTRAINT "currency_exchange_rates_target_currency_code_fkey" FOREIGN KEY ("target_currency_code") REFERENCES "core"."currencies"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."accounting_entities" ADD CONSTRAINT "accounting_entities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."accounting_entities" ADD CONSTRAINT "accounting_entities_functional_currency_code_fkey" FOREIGN KEY ("functional_currency_code") REFERENCES "core"."currencies"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."accounting_entities" ADD CONSTRAINT "accounting_entities_reporting_currency_code_fkey" FOREIGN KEY ("reporting_currency_code") REFERENCES "core"."currencies"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."ledger_accounts" ADD CONSTRAINT "ledger_accounts_accounting_entity_id_fkey" FOREIGN KEY ("accounting_entity_id") REFERENCES "core"."accounting_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."ledger_accounts" ADD CONSTRAINT "ledger_accounts_control_account_id_fkey" FOREIGN KEY ("control_account_id") REFERENCES "core"."ledger_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."ledger_accounts" ADD CONSTRAINT "ledger_accounts_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "core"."currencies"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."ledger_accounts" ADD CONSTRAINT "ledger_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_preferences" ADD CONSTRAINT "user_preferences_id_fkey" FOREIGN KEY ("id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."categories" ADD CONSTRAINT "categories_accounting_entity_id_fkey" FOREIGN KEY ("accounting_entity_id") REFERENCES "core"."accounting_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."categories" ADD CONSTRAINT "categories_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "core"."ledger_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit"."category_history" ADD CONSTRAINT "category_history_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "core"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit"."category_history" ADD CONSTRAINT "category_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."transactions" ADD CONSTRAINT "transactions_accounting_entity_id_fkey" FOREIGN KEY ("accounting_entity_id") REFERENCES "core"."accounting_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."transactions" ADD CONSTRAINT "transactions_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "core"."ledger_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."transactions" ADD CONSTRAINT "transactions_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "core"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."transaction_lines" ADD CONSTRAINT "transaction_lines_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "core"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."transaction_lines" ADD CONSTRAINT "transaction_lines_target_account_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "core"."ledger_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."transaction_lines" ADD CONSTRAINT "transaction_lines_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "core"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."journal_entries" ADD CONSTRAINT "journal_entries_accounting_entity_id_fkey" FOREIGN KEY ("accounting_entity_id") REFERENCES "core"."accounting_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."journal_entries" ADD CONSTRAINT "journal_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "core"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."journal_entries" ADD CONSTRAINT "journal_entries_voiding_entry_id_fkey" FOREIGN KEY ("voiding_entry_id") REFERENCES "core"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."journal_lines" ADD CONSTRAINT "journal_lines_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "core"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."journal_lines" ADD CONSTRAINT "journal_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "core"."ledger_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."journal_lines" ADD CONSTRAINT "journal_lines_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "core"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_sessions_user_id_refresh_token_unique_index" ON "core"."user_sessions" USING btree ("user_id" text_ops,"refresh_token" text_ops);
*/