import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

import {
  fiscalYearPeriodUnit,
  fiscalYearsTable,
  periodStatus,
  periodUnit,
} from '../config/accounting';
import { accountingEntitiesTable } from '../config/accounting-entity';
import toSchemaString from '../utils/to-schema-string';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType(fiscalYearPeriodUnit, ['month']);
  pgm.createType(periodUnit, ['day', 'week', 'month', 'quarter', 'year']);
  pgm.createType(periodStatus, ['pending', 'open', 'closing', 'closed']);

  pgm.createTable(fiscalYearsTable, {
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

    unit: {
      type: toSchemaString(fiscalYearPeriodUnit),
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

    status: {
      type: toSchemaString(periodStatus),
      notNull: true,
    },

    closed_at: {
      type: 'timestamptz',
    },

    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(fiscalYearsTable);

  pgm.dropType(periodStatus);
  pgm.dropType(fiscalYearPeriodUnit);
  pgm.dropType(periodUnit);
}
