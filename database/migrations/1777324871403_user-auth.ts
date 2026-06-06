import { MigrationBuilder } from 'node-pg-migrate';
import { userAuthTable, usersTable } from '../config/users';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable(
    userAuthTable,
    {
      user_id: {
        type: 'uuid',
        primaryKey: true,
        references: usersTable,
        onDelete: 'CASCADE',
      },

      password: { type: 'varchar(200)' },

      failed_login_attempts: { type: 'integer', default: 0 },

      strategies: { type: 'varchar(50)[]', notNull: true },

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
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable(userAuthTable);
};
