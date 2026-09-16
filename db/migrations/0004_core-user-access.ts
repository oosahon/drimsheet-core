import { MigrationBuilder } from 'node-pg-migrate';

import {
  DATABASE_USER_ADMIN,
  DATABASE_USER_CORE,
} from '../../src/infra/config/vars.config';
import { auditSchema, coreSchema, reportingSchema } from '../config/schemas';

export async function up(pgm: MigrationBuilder): Promise<void> {
  if (!DATABASE_USER_CORE || !DATABASE_USER_ADMIN) return;

  // Core Schema
  pgm.sql(`GRANT USAGE ON SCHEMA ${coreSchema} TO "${DATABASE_USER_CORE}";`);
  pgm.sql(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${coreSchema} TO "${DATABASE_USER_CORE}";`
  );
  pgm.sql(
    `ALTER DEFAULT PRIVILEGES FOR ROLE "${DATABASE_USER_ADMIN}" IN SCHEMA ${coreSchema} GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${DATABASE_USER_CORE}";`
  );

  // Audit Schema
  pgm.sql(`GRANT USAGE ON SCHEMA ${auditSchema} TO "${DATABASE_USER_CORE}";`);
  pgm.sql(
    `GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ${auditSchema} TO "${DATABASE_USER_CORE}";`
  );
  pgm.sql(
    `ALTER DEFAULT PRIVILEGES FOR ROLE "${DATABASE_USER_ADMIN}" IN SCHEMA ${auditSchema} GRANT SELECT, INSERT, UPDATE ON TABLES TO "${DATABASE_USER_CORE}";`
  );

  // Reporting Schema
  pgm.sql(
    `GRANT USAGE ON SCHEMA ${reportingSchema} TO "${DATABASE_USER_CORE}";`
  );
  pgm.sql(
    `GRANT SELECT ON ALL TABLES IN SCHEMA ${reportingSchema} TO "${DATABASE_USER_CORE}";`
  );
  pgm.sql(
    `ALTER DEFAULT PRIVILEGES FOR ROLE "${DATABASE_USER_ADMIN}" IN SCHEMA ${reportingSchema} GRANT SELECT ON TABLES TO "${DATABASE_USER_CORE}";`
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  if (!DATABASE_USER_CORE || !DATABASE_USER_ADMIN) return;

  // Revoke Reporting
  pgm.sql(
    `ALTER DEFAULT PRIVILEGES FOR ROLE "${DATABASE_USER_ADMIN}" IN SCHEMA ${reportingSchema} REVOKE SELECT ON TABLES FROM "${DATABASE_USER_CORE}";`
  );
  pgm.sql(
    `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${reportingSchema} FROM "${DATABASE_USER_CORE}";`
  );
  pgm.sql(
    `REVOKE USAGE ON SCHEMA ${reportingSchema} FROM "${DATABASE_USER_CORE}";`
  );

  // Revoke Audit
  pgm.sql(
    `ALTER DEFAULT PRIVILEGES FOR ROLE "${DATABASE_USER_ADMIN}" IN SCHEMA ${auditSchema} REVOKE SELECT, INSERT, UPDATE ON TABLES FROM "${DATABASE_USER_CORE}";`
  );
  pgm.sql(
    `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${auditSchema} FROM "${DATABASE_USER_CORE}";`
  );
  pgm.sql(
    `REVOKE USAGE ON SCHEMA ${auditSchema} FROM "${DATABASE_USER_CORE}";`
  );

  // Revoke Core
  pgm.sql(
    `ALTER DEFAULT PRIVILEGES FOR ROLE "${DATABASE_USER_ADMIN}" IN SCHEMA ${coreSchema} REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM "${DATABASE_USER_CORE}";`
  );
  pgm.sql(
    `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${coreSchema} FROM "${DATABASE_USER_CORE}";`
  );
  pgm.sql(`REVOKE USAGE ON SCHEMA ${coreSchema} FROM "${DATABASE_USER_CORE}";`);
}
