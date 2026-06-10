import { MigrationBuilder } from 'node-pg-migrate';
import { auditSchema } from '../config/schemas';

export const up = (pgm: MigrationBuilder) => {
  pgm.createSchema(auditSchema, { ifNotExists: true });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropSchema(auditSchema, { ifExists: true, cascade: true });
};
