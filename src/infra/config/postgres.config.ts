import { drizzle } from 'drizzle-orm/node-postgres';
import * as relations from './drizzle/relations';
import * as schema from './drizzle/schema';
import { POSTGRES_URL } from './vars.config';

export const postgres = drizzle(POSTGRES_URL, {
  schema: {
    ...schema,
    ...relations,
  },
});
