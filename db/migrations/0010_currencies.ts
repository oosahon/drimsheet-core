import { MigrationBuilder } from 'node-pg-migrate';

import { currenciesTable } from '../config/currencies';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    currenciesTable,
    {
      code: {
        type: 'varchar(3)',
        primaryKey: true,
      },

      symbol: { type: 'varchar(5)', notNull: true },

      name: { type: 'varchar(50)', notNull: true },

      minor_unit: { type: 'smallint', notNull: true },

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

      deleted_at: {
        type: 'timestamptz',
      },
    },
    {
      ifNotExists: true,
    }
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(currenciesTable);
}
