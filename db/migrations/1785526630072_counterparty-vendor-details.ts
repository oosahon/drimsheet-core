import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import {
  counterpartiesTable,
  counterpartyVendorDetailsTable,
} from '../config/counterparties';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    counterpartyVendorDetailsTable,
    {
      counterparty_id: {
        type: 'uuid',
        primaryKey: true,
        references: counterpartiesTable,
        onDelete: 'CASCADE',
        notNull: true,
      },

      address_line_1: {
        type: 'varchar(255)',
      },

      address_line_2: {
        type: 'varchar(255)',
      },

      address_city: {
        type: 'varchar(100)',
      },

      address_region: {
        type: 'varchar(100)',
      },

      address_postal_code: {
        type: 'varchar(20)',
      },

      address_country_code: {
        type: 'varchar(2)',
      },

      created_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('now()'),
      },
    },
    {
      ifNotExists: true,
    }
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(counterpartyVendorDetailsTable);
}
