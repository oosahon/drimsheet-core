import { MigrationBuilder } from 'node-pg-migrate';

import { actorHistoryTable, actorsTable } from '../config/actors';
import toSchemaString from '../utils/to-schema-string';

export function up(pgm: MigrationBuilder) {
  pgm.createTable(actorsTable, {
    id: { type: 'uuid', primaryKey: true },
    type: { type: 'varchar(20)', notNull: true },
    username: { type: 'varchar(319)', notNull: true, unique: true },
    display_name: { type: 'varchar(319)', notNull: true },
    owner_actor_id: {
      type: 'uuid',
      references: actorsTable,
      onDelete: 'RESTRICT',
    },
    agent_name: { type: 'varchar(64)' },
    status: { type: 'varchar(20)', notNull: true },
    created_by: {
      type: 'uuid',
      notNull: true,
      references: actorsTable,
      onDelete: 'RESTRICT',
    },
    version: { type: 'integer', notNull: true },
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
  pgm.addConstraint(actorsTable, 'actors_type_ck', {
    check: "type IN ('user','system','migration','ai_agent')",
  });
  pgm.addConstraint(actorsTable, 'actors_status_ck', {
    check: "status IN ('active','disabled')",
  });
  pgm.addConstraint(actorsTable, 'actors_version_ck', { check: 'version > 0' });
  pgm.addConstraint(actorsTable, 'actors_username_canonical_ck', {
    check: 'length(username) > 0 AND username = lower(btrim(username))',
  });
  pgm.addConstraint(actorsTable, 'actors_display_name_ck', {
    check: 'length(btrim(display_name)) > 0',
  });
  pgm.addConstraint(actorsTable, 'actors_owner_ck', {
    check:
      "(owner_actor_id IS NULL AND agent_name IS NULL) OR (type = 'ai_agent' AND owner_actor_id IS NOT NULL AND agent_name IS NOT NULL AND agent_name ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND owner_actor_id <> id)",
  });
  pgm.addConstraint(actorsTable, 'actors_username_kind_ck', {
    check:
      "(type = 'user' AND username LIKE '%@%') OR (type = 'system' AND username = 'drimsheet-core') OR (type = 'migration' AND username = 'drimsheet-migration') OR (type = 'ai_agent' AND ((owner_actor_id IS NULL AND username = 'drimsheet-core-ai') OR (owner_actor_id IS NOT NULL AND username LIKE '%@%/' || agent_name)))",
  });
  pgm.addConstraint(actorsTable, 'actors_owner_name_key', {
    unique: ['owner_actor_id', 'agent_name'],
  });
  pgm.createIndex(actorsTable, 'created_by');

  pgm.createTable(actorHistoryTable, {
    id: { type: 'bigserial', primaryKey: true },
    actor_entity_id: {
      type: 'uuid',
      notNull: true,
      references: actorsTable,
      onDelete: 'RESTRICT',
    },
    actor_id: {
      type: 'uuid',
      notNull: true,
      references: actorsTable,
      onDelete: 'RESTRICT',
    },
    on_behalf_of: {
      type: 'uuid',
      references: actorsTable,
      onDelete: 'RESTRICT',
    },
    action: { type: 'varchar(50)', notNull: true },
    diff: { type: 'jsonb', notNull: true },
    correlation_id: { type: 'varchar(255)' },
    occurred_at: { type: 'timestamptz', notNull: true },
    recorded_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
  pgm.createIndex(actorHistoryTable, ['actor_entity_id', 'occurred_at', 'id']);
  pgm.createIndex(actorHistoryTable, 'actor_id');
  pgm.createIndex(actorHistoryTable, 'on_behalf_of');

  const actors = toSchemaString(actorsTable);
  const history = toSchemaString(actorHistoryTable);
  pgm.sql(`WITH identity AS (SELECT uuid_generate_v4() AS id)
    INSERT INTO ${actors} (id,type,username,display_name,status,created_by,version)
    SELECT id,'migration','drimsheet-migration','Drimsheet Migration','active',id,1 FROM identity`);
  pgm.sql(`INSERT INTO ${actors} (id,type,username,display_name,status,created_by,version)
    SELECT uuid_generate_v4(), seed.type, seed.username, seed.display_name, 'active', migration.id, 1
    FROM ${actors} migration CROSS JOIN (VALUES
      ('system','drimsheet-core','Drimsheet Core'),
      ('ai_agent','drimsheet-core-ai','Drimsheet AI')
    ) AS seed(type,username,display_name) WHERE migration.username = 'drimsheet-migration'`);
  pgm.sql(`INSERT INTO ${history} (actor_entity_id,actor_id,action,diff,correlation_id,occurred_at)
    SELECT actor.id,migration.id,'created',jsonb_build_object('before',NULL,'after',to_jsonb(actor)),'migration:actors',actor.created_at
    FROM ${actors} actor CROSS JOIN ${actors} migration WHERE migration.username = 'drimsheet-migration'`);
}

export function down(pgm: MigrationBuilder) {
  pgm.dropTable(actorHistoryTable);
  pgm.dropTable(actorsTable);
}
