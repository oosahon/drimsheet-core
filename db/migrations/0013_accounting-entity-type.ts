import { MigrationBuilder } from 'node-pg-migrate';

import { accountingEntityType } from '../config/accounting-entity';

export const up = (pgm: MigrationBuilder) => {
  pgm.createType(accountingEntityType, [
    'individual',
    'sole_trader',
    'private_company',
  ]);
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropType(accountingEntityType);
};
