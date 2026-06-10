import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import {
  accountingContextsTable,
  accountingPeriodsTable,
  accountingStandardsTable,
  fiscalYearsTable,
} from '../config/accounting';
import { accountingEntitiesTable } from '../config/accounting-entity';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(accountingContextsTable, {
    id: {
      type: 'uuid',
      default: pgm.func('uuid_generate_v4()'),
      primaryKey: true,
    },

    name: {
      type: 'varchar(150)',
      notNull: true,
    },

    description: {
      type: 'varchar(255)',
    },

    accounting_entity_id: {
      type: 'uuid',
      notNull: true,
      references: accountingEntitiesTable,
      onDelete: 'CASCADE',
    },

    accounting_standard_code: {
      type: 'varchar(15)',
      notNull: true,
      references: accountingStandardsTable,
      onDelete: 'RESTRICT',
    },

    fiscal_year_id: {
      type: 'uuid',
      notNull: true,
      references: fiscalYearsTable,
      onDelete: 'CASCADE',
    },

    current_operating_period_id: {
      type: 'uuid',
      notNull: true,
      references: accountingPeriodsTable,
      onDelete: 'RESTRICT',
    },

    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },

    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },

    closed_at: {
      type: 'timestamptz',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(accountingContextsTable);
}
