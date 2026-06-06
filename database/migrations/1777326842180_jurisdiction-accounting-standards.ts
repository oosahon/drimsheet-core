import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import {
  accountingStandardsTable,
  jurisdictionAccountingStandardsTable,
  jurisdictionsTable,
} from '../config/accounting';
import { accountingEntityType } from '../config/accounting-entity';
import toSchemaString from '../utils/to-schema-string';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(jurisdictionAccountingStandardsTable, {
    jurisdiction_code: {
      type: 'varchar(2)',
      notNull: true,
      references: jurisdictionsTable,
      onDelete: 'CASCADE',
      primaryKey: true,
    },

    accounting_standard_code: {
      type: 'varchar(15)',
      notNull: true,
      references: accountingStandardsTable,
      onDelete: 'CASCADE',
      primaryKey: true,
    },

    accounting_entity_type: {
      type: toSchemaString(accountingEntityType),
      notNull: true,
      onDelete: 'RESTRICT',
      primaryKey: true,
    },

    created_at: {
      type: 'timestamptz',
      default: pgm.func('now()'),
      notNull: true,
    },

    updated_at: {
      type: 'timestamptz',
      default: pgm.func('now()'),
      notNull: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(jurisdictionAccountingStandardsTable);
}
