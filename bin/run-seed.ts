import path from 'path';
import fs from 'fs';
import { eq } from 'drizzle-orm';
import { db } from '../src/infra/persistence';
import logger from '../src/infra/observability/logger';
import { seeds } from '../src/infra/persistence/drizzle/schema';

function getAllSeeds() {
  const seedsDir = path.join(__dirname, '../src/infra/persistence/seeds');
  return fs
    .readdirSync(seedsDir)
    .filter((file) => file.endsWith('.ts') && !file.startsWith('index.'));
}

async function runSeed(seed: string) {
  try {
    const seedModule = require(
      path.join(__dirname, '../src/infra/persistence/seeds', seed)
    );

    await db.transaction(async (tx) => {
      const seedName = path.parse(seed).name;
      const seedExists = await tx
        .select()
        .from(seeds)
        .where(eq(seeds.fileName, seedName))
        .limit(1);

      if (seedExists.length > 0) {
        return;
      }

      await seedModule.default(tx);
    });
  } catch (error) {
    logger.error(`❌ Failed to run seed: ${seed}: `, error);
    process.exit(1);
  }
}

async function runAllSeeds() {
  logger.info('🚀 Starting database seeding...');
  try {
    const seedsToRun = getAllSeeds().sort();
    for (const seed of seedsToRun) {
      await runSeed(seed);
    }

    logger.info('✅ All seeds completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runAllSeeds();
