import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

import { accountingEntitiesTable } from '../config/accounting-entity';
import { actorsTable } from '../config/actors';
import { userPreferencesTable, usersTable } from '../config/users';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(userPreferencesTable, {
    created_by: {
      type: 'uuid',
      notNull: true,
      references: actorsTable,
      onDelete: 'RESTRICT',
    },
    id: {
      type: 'uuid',
      primaryKey: true,
      references: usersTable,
      onDelete: 'CASCADE',
    },

    app_preferences: {
      type: 'jsonb',
    },

    last_active_accounting_entity_id: {
      type: 'uuid',
      notNull: false,
      references: accountingEntitiesTable,
      onDelete: 'SET NULL',
    },

    created_at: {
      type: 'timestamptz',
      default: pgm.func('now()'),
      notNull: true,
    },

    updated_at: {
      type: 'timestamptz',
      notNull: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(userPreferencesTable);
}
