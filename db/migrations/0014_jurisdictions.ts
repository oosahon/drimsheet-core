import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

import { jurisdictionsTable } from '../config/accounting';
import { actorsTable } from '../config/actors';
import { currenciesTable } from '../config/currencies';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(jurisdictionsTable, {
    created_by: {
      type: 'uuid',
      notNull: true,
      references: actorsTable,
      onDelete: 'RESTRICT',
    },
    code: {
      type: 'varchar(2)',
      primaryKey: true,
    },

    name: {
      type: 'varchar(70)',
      notNull: true,
    },

    currency_code: {
      type: 'varchar(3)',
      notNull: true,
      references: currenciesTable,
      onDelete: 'RESTRICT',
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

    deleted_at: {
      type: 'timestamptz',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(jurisdictionsTable);
}
