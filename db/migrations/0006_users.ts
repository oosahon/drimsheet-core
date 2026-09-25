import { MigrationBuilder } from 'node-pg-migrate';

import { actorsTable } from '../config/actors';
import { usersTable } from '../config/users';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable(
    usersTable,
    {
      actor_id: {
        type: 'uuid',
        notNull: true,
        unique: true,
        references: actorsTable,
        onDelete: 'RESTRICT',
      },
      created_by: {
        type: 'uuid',
        notNull: true,
        references: actorsTable,
        onDelete: 'RESTRICT',
      },
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('uuid_generate_v4()'),
      },

      first_name: { type: 'varchar(100)', notNull: true },

      last_name: { type: 'varchar(100)', notNull: true },

      email: { type: 'varchar(254)', notNull: true, unique: true },

      email_verified: { type: 'boolean', notNull: true },

      version: { type: 'integer', notNull: true },

      created_at: {
        type: 'timestamptz',
        default: pgm.func('now()'),
        notNull: true,
      },

      updated_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('now()'),
      },

      deleted_at: { type: 'timestamptz' },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(usersTable, 'users_version_positive_ck', {
    check: 'version > 0',
  });
  pgm.createIndex(usersTable, 'created_by');
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable(usersTable);
};
