import { drizzle } from 'drizzle-orm/node-postgres';
import * as relations from '../../infra/config/drizzle/relations';
import * as schema from '../../infra/config/drizzle/schema';
import { POSTGRES_URL } from './vars.config';

export const postgres = drizzle(POSTGRES_URL, {
  schema: {
    ...schema,
    ...relations,
  },
});
