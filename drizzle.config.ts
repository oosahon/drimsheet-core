import { defineConfig } from 'drizzle-kit';

import vars from './src/infra/config/vars.config';

export default defineConfig({
  dialect: 'postgresql',
  out: './src/infra/config/drizzle',
  dbCredentials: {
    url: vars.POSTGRES_URL,
  },
  schemaFilter: ['core', 'audit', 'public'],
});
