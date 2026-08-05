import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import { accountingEntitiesTable } from '../config/accounting-entity';
import {
  journalEntriesTable,
  journalEntrySourceType,
  journalEntryStatus,
} from '../config/journal-entries';
import { usersTable } from '../config/users';
import toSchemaString from '../utils/to-schema-string';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType(journalEntryStatus, ['draft', 'posted', 'voided', 'archived']);
  pgm.createType(journalEntrySourceType, [
    'sale',
    'purchase',
    'credit_note',
    'debit_note',
    'expense',
    'transfer',
    'payment',
    'receipt',
    'adjustment',
    'system',
    'opening_balance',
  ]);

  pgm.createTable(journalEntriesTable, {
    id: {
      type: 'uuid',
      primaryKey: true,
      notNull: true,
    },

    accounting_entity_id: {
      type: 'uuid',
      references: accountingEntitiesTable,
      notNull: true,
      onDelete: 'CASCADE',
    },

    source_type: {
      type: toSchemaString(journalEntrySourceType),
      notNull: true,
    },

    memo: {
      type: 'varchar(100)',
    },

    status: {
      type: toSchemaString(journalEntryStatus),
      notNull: true,
    },

    effective_date: {
      type: 'date',
      notNull: true,
    },

    posted_at: {
      type: 'timestamptz',
    },

    voided_at: {
      type: 'timestamptz',
    },

    voiding_entry_id: {
      type: 'uuid',
      references: journalEntriesTable,
    },

    version: {
      type: 'integer',
      notNull: true,
      default: 1,
    },

    created_by: {
      type: 'uuid',
      notNull: true,
      references: usersTable,
      onDelete: 'CASCADE',
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
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(journalEntriesTable);

  pgm.dropType(journalEntryStatus);
  pgm.dropType(journalEntrySourceType);
}
