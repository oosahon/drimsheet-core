import { drizzle } from 'drizzle-orm/node-postgres';
import { POSTGRES_URL } from './vars.config';

export const postgres = drizzle(POSTGRES_URL);
