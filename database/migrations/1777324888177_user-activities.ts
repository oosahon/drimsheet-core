import { MigrationBuilder } from 'node-pg-migrate';
import { userActivitiesTable, usersTable } from '../config/users';

export const shorthands = undefined;

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable(
    userActivitiesTable,
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('uuid_generate_v4()'),
      },

      user_id: {
        type: 'uuid',
        references: usersTable,
        onDelete: 'CASCADE',
        notNull: false,
      },

      event_key: { type: 'varchar(150)', notNull: true },

      description: { type: 'varchar(100)', notNull: true },

      meta: { type: 'jsonb' },

      created_at: {
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
  pgm.dropTable(userActivitiesTable);
};
