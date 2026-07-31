import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import { accountingEntitiesTable } from '../config/accounting-entity';
import {
  counterpartiesTable,
  counterpartyStatus,
  counterpartyType,
} from '../config/counterparties';
import toSchemaString from '../utils/to-schema-string';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType(counterpartyStatus, ['active', 'archived']);
  pgm.createType(counterpartyType, ['individual', 'organization']);

  pgm.createTable(counterpartiesTable, {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },

    accounting_entity_id: {
      type: 'uuid',
      references: accountingEntitiesTable,
      notNull: true,
    },

    name: {
      type: 'varchar(100)',
      notNull: true,
    },

    status: {
      type: toSchemaString(counterpartyStatus),
      notNull: true,
    },

    type: {
      type: toSchemaString(counterpartyType),
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
  });

  pgm.createIndex(counterpartiesTable, ['accounting_entity_id'], {
    name: 'counterparties_accounting_entity_id_idx',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(counterpartiesTable);
  pgm.dropType(counterpartyType);
  pgm.dropType(counterpartyStatus);
}
