import { execFileSync } from 'node:child_process';

import dotenv from 'dotenv';

dotenv.config({ quiet: true });

if (!process.env.SENTRY_DSN?.trim()) {
  console.log(
    'Skipping Sentry source-map upload because SENTRY_DSN is not configured.'
  );
  process.exit(0);
}

const sentryProjectArguments = [
  '--org',
  'drimsheet',
  '--project',
  'drimsheet-core',
];

execFileSync(
  'sentry-cli',
  ['sourcemaps', 'inject', ...sentryProjectArguments, './dist'],
  { stdio: 'inherit' }
);

execFileSync(
  'sentry-cli',
  ['sourcemaps', 'upload', ...sentryProjectArguments, './dist'],
  { stdio: 'inherit' }
);
