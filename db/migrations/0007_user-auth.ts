import { MigrationBuilder } from 'node-pg-migrate';

import { actorsTable } from '../config/actors';
import { userAuthTable, usersTable } from '../config/users';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable(
    userAuthTable,
    {
      created_by: {
        type: 'uuid',
        notNull: true,
        references: actorsTable,
        onDelete: 'RESTRICT',
      },
      user_id: {
        type: 'uuid',
        primaryKey: true,
        references: usersTable,
        onDelete: 'CASCADE',
      },

      password: { type: 'varchar(200)' },

      failed_login_attempts: { type: 'integer', default: 0 },

      strategies: { type: 'varchar(50)[]', notNull: true },

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
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(userAuthTable, 'user_auth_version_positive_ck', {
    check: 'version > 0',
  });
  pgm.createIndex(userAuthTable, 'created_by');
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable(userAuthTable);
};
