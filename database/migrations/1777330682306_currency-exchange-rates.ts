import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import {
  currenciesTable,
  currencyExchangeRatesTable,
  currencyExchangeRateType,
} from '../config/currencies';
import toSchemaString from '../utils/to-schema-string';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType(currencyExchangeRateType, ['official', 'negotiated']);

  pgm.createTable(currencyExchangeRatesTable, {
    id: {
      type: 'bigserial',
      primaryKey: true,
    },

    currency_pair: {
      type: 'varchar(7)',
      notNull: true,
    },

    base_currency_code: {
      type: 'varchar(3)',
      notNull: true,
      references: currenciesTable,
    },

    target_currency_code: {
      type: 'varchar(3)',
      notNull: true,
      references: currenciesTable,
    },

    rate: {
      type: 'numeric',
      notNull: true,
    },

    type: {
      type: toSchemaString(currencyExchangeRateType),
      notNull: true,
    },

    as_of: {
      type: 'date',
      notNull: true,
    },

    source: {
      type: 'varchar(100)',
      notNull: true,
    },

    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(currencyExchangeRatesTable);

  pgm.dropType(currencyExchangeRateType);
}
