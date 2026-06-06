import { MigrationBuilder } from 'node-pg-migrate';
import { reportingSchema } from '../config/schemas';

export const up = (pgm: MigrationBuilder) => {
  pgm.createSchema(reportingSchema, { ifNotExists: true });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropSchema(reportingSchema, { ifExists: true, cascade: true });
};
