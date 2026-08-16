import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import errorUtils from '@shared/utils/error';

export interface IExtractedErrorKey {
  filePath: string;
  key: string;
}

export const ERROR_KEY_CATALOGUE_BASELINE = 271;

function getErrorFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getErrorFiles(filePath, fileList);
    } else if (filePath.endsWith('.error.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

export function extractKeys(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /const\s+EErrorKeys\s*=\s*\{([\s\S]*?)\}\s*as\s*const/g;
  const match = regex.exec(content);
  if (!match) return [];

  const block = match[1];
  const keys: string[] = [];
  const propRegex = /[a-zA-Z0-9_]+\s*:\s*['"]([^'"]+)['"]/g;

  let propMatch;
  while ((propMatch = propRegex.exec(block)) !== null) {
    const key = propMatch[1];

    keys.push(key);
  }
  return keys;
}

export function validateExtractedErrorKeys(
  entries: IExtractedErrorKey[],
  minimumCount = 0
): string[] {
  const invalidEntries = entries.filter(
    ({ key }) => !errorUtils.getErrorKeyStatusSuffix(key)
  );
  const declarationsByKey = new Map<string, string[]>();

  for (const { filePath, key } of entries) {
    const declarations = declarationsByKey.get(key) ?? [];

    declarations.push(filePath);
    declarationsByKey.set(key, declarations);
  }

  const duplicateEntries = Array.from(declarationsByKey.entries()).filter(
    ([, filePaths]) => filePaths.length > 1
  );
  const diagnostics: string[] = [];

  if (invalidEntries.length > 0) {
    diagnostics.push(
      'Invalid error keys:',
      ...invalidEntries.map(({ filePath, key }) => `- ${filePath}: ${key}`)
    );
  }

  if (duplicateEntries.length > 0) {
    diagnostics.push(
      'Duplicate error keys:',
      ...duplicateEntries.map(
        ([key, filePaths]) => `- ${key}: ${filePaths.join(', ')}`
      )
    );
  }

  if (entries.length < minimumCount) {
    diagnostics.push(
      `Error-key count regression: found ${entries.length}, expected at least ${minimumCount}`
    );
  }

  if (diagnostics.length > 0) {
    throw new Error(diagnostics.join('\n'));
  }

  return Array.from(declarationsByKey.keys()).sort();
}

function main() {
  const srcDir = path.resolve(__dirname, '../src');
  const exportsDir = path.resolve(__dirname, '../generated');

  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  const errorFiles = getErrorFiles(srcDir).sort();
  const extractedKeys = errorFiles.flatMap((filePath) =>
    extractKeys(filePath).map((key) => ({
      filePath: path.relative(path.resolve(__dirname, '..'), filePath),
      key,
    }))
  );
  const sortedKeys = validateExtractedErrorKeys(
    extractedKeys,
    ERROR_KEY_CATALOGUE_BASELINE
  );

  const outputPath = path.join(exportsDir, 'error-keys.json');
  fs.writeFileSync(outputPath, JSON.stringify(sortedKeys, null, 2), 'utf8');
  execFileSync('npx', ['prettier', '--write', outputPath], {
    stdio: 'inherit',
  });
  console.log(
    `✅ Successfully exported ${sortedKeys.length} error keys to generated/error-keys.json`
  );
}

if (require.main === module) {
  main();
}
