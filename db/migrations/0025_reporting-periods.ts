import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

import {
  fiscalYearsTable,
  periodUnit,
  reportingPeriodsTable,
} from '../config/accounting';
import { accountingEntitiesTable } from '../config/accounting-entity';
import toSchemaString from '../utils/to-schema-string';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(reportingPeriodsTable, {
    id: {
      type: 'uuid',
      default: pgm.func('uuid_generate_v4()'),
      primaryKey: true,
    },

    name: {
      type: 'varchar(150)',
      notNull: true,
    },

    accounting_entity_id: {
      type: 'uuid',
      notNull: true,
      references: accountingEntitiesTable,
      onDelete: 'CASCADE',
    },

    fiscal_year_id: {
      type: 'uuid',
      notNull: true,
      references: fiscalYearsTable,
      onDelete: 'CASCADE',
    },

    unit: {
      type: toSchemaString(periodUnit),
      notNull: true,
    },

    count: {
      type: 'smallint',
      notNull: true,
    },

    start_date: {
      type: 'date',
      notNull: true,
    },

    end_date: {
      type: 'date',
      notNull: true,
    },

    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(reportingPeriodsTable);
}
