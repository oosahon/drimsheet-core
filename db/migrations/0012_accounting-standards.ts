import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

import { accountingStandardsTable } from '../config/accounting';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    accountingStandardsTable,
    {
      code: {
        type: 'varchar(15)',
        primaryKey: true,
      },

      name: {
        type: 'varchar(100)',
        notNull: true,
      },

      link: {
        type: 'varchar(200)',
      },

      is_supported: {
        type: 'boolean',
        notNull: true,
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

      deleted_at: { type: 'timestamptz' },
    },
    {
      ifNotExists: true,
    }
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(accountingStandardsTable);
}
