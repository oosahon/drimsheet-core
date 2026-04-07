-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE TYPE "public"."category_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TABLE "core"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(200) NOT NULL,
	"last_name" varchar(200) NOT NULL,
	"email" varchar(200) NOT NULL,
	"email_verified" boolean NOT NULL,
	"password" varchar(200),
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit"."user_activities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"action" varchar(50) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"tax_key" varchar(250) NOT NULL,
	"type" "category_type" NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar(200) NOT NULL,
	"status" "category_status" DEFAULT 'active' NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "categories_tax_key_key" UNIQUE("tax_key")
);
--> statement-breakpoint
CREATE TABLE "pgmigrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"run_on" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "core"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_activities_actor_id_index" ON "audit"."user_activities" USING btree ("actor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "user_activities_resource_type_resource_id_index" ON "audit"."user_activities" USING btree ("resource_type" text_ops,"resource_id" text_ops);--> statement-breakpoint
CREATE INDEX "categories_parent_id_index" ON "core"."categories" USING btree ("parent_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "categories_user_id_index" ON "core"."categories" USING btree ("user_id" uuid_ops);
*/