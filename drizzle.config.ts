import { defineConfig } from 'drizzle-kit';
import { POSTGRES_URL } from './src/infra/config/vars.config';

export default defineConfig({
  dialect: 'postgresql',
  out: './src/infra/persistence/drizzle',
  dbCredentials: {
    url: POSTGRES_URL,
  },
  schemaFilter: ['core', 'audit', 'public'],
});
