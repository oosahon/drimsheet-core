/**
 * scripts/run-e2e-seeds.ts
 *
 * Runs all seeds living in `e2e/seeds/` of the pl-web project.
 *
 * This script is called by pl-web's `global.setup.ts` before E2E tests run.
 * It is intentionally separate from the app's own `scripts/run-seed.ts` to keep
 * E2E fixtures from polluting production/dev seed tracking.
 *
 * Seeds are simple async functions that receive a Drizzle transaction and
 * insert rows using ON CONFLICT DO NOTHING, making them idempotent.
 *
 * Usage (called from pl-web/e2e/global.setup.ts):
 *   npx tsx scripts/run-e2e-seeds.ts
 */
import fs from 'fs';
import path from 'path';
import { postgres as db } from '../src/infra/config/postgres.config';
import logger from '../src/infra/observability/logger';

// Path to pl-web's e2e seeds, resolved relative to pl-core's location
const E2E_SEEDS_DIR = path.resolve(__dirname, '../../pl-web/e2e/seeds');

function getE2ESeedFiles(): string[] {
  if (!fs.existsSync(E2E_SEEDS_DIR)) {
    logger.warn(`⚠️  E2E seeds directory not found: ${E2E_SEEDS_DIR}`);
    return [];
  }

  return fs
    .readdirSync(E2E_SEEDS_DIR)
    .filter((file) => file.endsWith('.seed.ts') && !file.startsWith('index.'))
    .sort(); // run in numbered order
}

async function runE2ESeed(seedFile: string): Promise<void> {
  const seedPath = path.join(E2E_SEEDS_DIR, seedFile);

  try {
    // Seeds in pl-web export their identity constants but don't export
    // a default function — they define the DATA, the actual DB insertion
    // is handled by the backend seed runner below.
    //
    // If a seed exports a `default` async function, we call it here.
    const seedModule = await import(seedPath);

    if (typeof seedModule.default === 'function') {
      await db.transaction(async (tx: any) => {
        await seedModule.default(tx);
      });
      logger.info(`✅ E2E seed applied: ${seedFile}`);
    } else {
      // The seed file is identity-only (constants), no DB work needed here.
      logger.info(`⏭️  E2E seed identity-only (no DB): ${seedFile}`);
    }
  } catch (error) {
    logger.error(`❌ Failed to run E2E seed: ${seedFile}`, error);
    process.exit(1);
  }
}

async function runAllE2ESeeds(): Promise<void> {
  logger.info('🌱 Starting E2E database seeding...');

  const seedFiles = getE2ESeedFiles();

  if (seedFiles.length === 0) {
    logger.info('No E2E seeds found — skipping.');
    process.exit(0);
  }

  for (const seedFile of seedFiles) {
    await runE2ESeed(seedFile);
  }

  logger.info('✅ All E2E seeds completed successfully.');
  process.exit(0);
}

runAllE2ESeeds();
