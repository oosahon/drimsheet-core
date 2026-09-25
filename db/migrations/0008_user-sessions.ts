import { MigrationBuilder } from 'node-pg-migrate';

import { actorsTable } from '../config/actors';
import { userSessionsTable, usersTable } from '../config/users';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable(
    userSessionsTable,
    {
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

      user_id: {
        type: 'uuid',
        notNull: true,
        references: usersTable,
        onDelete: 'CASCADE',
      },

      refresh_token: { type: 'text', notNull: true, unique: true },

      last_login_at: { type: 'timestamptz' },

      created_at: {
        type: 'timestamptz',
        default: pgm.func('now()'),
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.createIndex(userSessionsTable, ['user_id', 'refresh_token'], {
    unique: true,
  });
  pgm.createIndex(userSessionsTable, 'created_by');
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable(userSessionsTable);
};
