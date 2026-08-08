import fs from 'node:fs';
import path from 'node:path';

const distRoot = path.resolve('dist');
const aliasPattern = /@(domain|app|infra|interface|shared)\//;
const unresolvedFiles = [];

const scan = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      scan(entryPath);
    } else if (entry.name.endsWith('.js')) {
      const source = fs.readFileSync(entryPath, 'utf8');

      if (aliasPattern.test(source)) unresolvedFiles.push(entryPath);
    }
  }
};

scan(distRoot);

if (unresolvedFiles.length > 0) {
  console.error('Built JavaScript contains unresolved layer aliases:');
  unresolvedFiles.forEach((file) => console.error(path.relative('.', file)));
  process.exitCode = 1;
}
