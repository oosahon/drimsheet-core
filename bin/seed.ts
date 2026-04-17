import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config({ path: '.env.test' });

const seedsDir = path.join(__dirname, '../e2e/seeds');

async function runSeeds() {
  try {
    const files = fs.readdirSync(seedsDir);

    // Pattern to match xxx-*.seed.ts
    const seedFiles = files
      .filter((file) => /^\d{3}-.*\.seed\.ts$/.test(file))
      .sort(); // Sorting strings alphabetically ensures 001 runs before 002

    if (seedFiles.length === 0) {
      console.log('No seed files found in', seedsDir);
      return;
    }

    console.log(
      `Found ${seedFiles.length} seed file(s). Running sequentially...`
    );

    for (const file of seedFiles) {
      const filePath = path.join(seedsDir, file);
      console.log(`\n▶ Running seed: ${file}`);

      // Dynamically import the seed file
      const module = await import(filePath);

      // Depending on module system, default export might be nested
      const seedFunc = module.default?.default || module.default;

      if (typeof seedFunc !== 'function') {
        throw new Error(`File ${file} does not export a default function.`);
      }

      // Execute the seed function
      await seedFunc();

      console.log(`✔ Finished seed: ${file}`);
    }

    console.log('\nAll seeds executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\nError running seeds:', error);
    process.exit(1);
  }
}

runSeeds();
