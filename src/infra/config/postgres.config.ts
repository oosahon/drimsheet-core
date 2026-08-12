import { drizzle } from 'drizzle-orm/node-postgres';

import * as relations from '@infra/config/drizzle/relations';
import * as schema from '@infra/config/drizzle/schema';

import vars from './vars.config';

export const postgres = drizzle(vars.POSTGRES_URL, {
  schema: {
    ...schema,
    ...relations,
  },
});
