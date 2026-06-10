import { MigrationBuilder } from 'node-pg-migrate';
import { coreSchema } from '../config/schemas';

export const up = (pgm: MigrationBuilder) => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });
  pgm.createSchema(coreSchema, { ifNotExists: true });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropSchema(coreSchema, { ifExists: true, cascade: true });
};
