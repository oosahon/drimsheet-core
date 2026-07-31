import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import {
  counterpartiesTable,
  counterpartyRole,
  counterpartyRolesTable,
} from '../config/counterparties';
import toSchemaString from '../utils/to-schema-string';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType(counterpartyRole, ['employer', 'vendor', 'contractor']);

  pgm.createTable(counterpartyRolesTable, {
    counterparty_id: {
      type: 'uuid',
      references: counterpartiesTable,
      notNull: true,
    },

    role: {
      type: toSchemaString(counterpartyRole),
      notNull: true,
    },

    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint(counterpartyRolesTable, 'counterparty_roles_pkey', {
    primaryKey: ['counterparty_id', 'role'],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(counterpartyRolesTable);
  pgm.dropType(counterpartyRole);
}
