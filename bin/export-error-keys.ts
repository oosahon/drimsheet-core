import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

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

function extractKeys(filePath: string): string[] {
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

function main() {
  const srcDir = path.resolve(__dirname, '../src');
  const exportsDir = path.resolve(__dirname, '../exports');

  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  const errorFiles = getErrorFiles(srcDir);
  const allKeys = new Set<string>();

  for (const file of errorFiles) {
    const keys = extractKeys(file);
    keys.forEach((key) => allKeys.add(key));
  }

  const sortedKeys = Array.from(allKeys).sort();

  const outputPath = path.join(exportsDir, 'error-keys.json');
  fs.writeFileSync(outputPath, JSON.stringify(sortedKeys, null, 2), 'utf8');
  execSync(`npx prettier --write ${outputPath}`, { stdio: 'inherit' });
  console.log(
    `✅ Successfully exported ${sortedKeys.length} error keys to exports/error-keys.json`
  );
}

main();
