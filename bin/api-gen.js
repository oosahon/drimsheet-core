import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { generateApi } from 'swagger-typescript-api';

dotenv.config();

const OUTPUT_DIR = path.resolve('tests/utils/api');

async function generateTypes() {
  try {
    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    await generateApi({
      name: 'api.ts',
      input: path.resolve('./swagger.json'),
      output: OUTPUT_DIR,
      httpClientType: 'axios',
      generateClient: true,
      defaultResponseAsSuccess: false,
    });

    console.log(`✅ API client & types generated in ${OUTPUT_DIR}`);
  } catch (err) {
    console.error('❌ Failed to generate types:', err);
    process.exit(1);
  }
}

generateTypes();
