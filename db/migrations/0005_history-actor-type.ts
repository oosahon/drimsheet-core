import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import { historyActorType } from '../config/history';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType(historyActorType, ['user', 'system', 'migration']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropType(historyActorType);
}
