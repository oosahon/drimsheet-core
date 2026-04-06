import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ADRS_DIR = path.join(__dirname, '../docs/adrs');
const INDEX_FILE = path.join(__dirname, '../docs/09_architecture_decisions.md');

function runCmd(cmd: string) {
  console.log(`Running: ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

function toKebabCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '');
}

async function main() {
  const target = process.argv[2];
  const newTitle = process.argv[3];

  if (!target || !newTitle) {
    console.error(
      'Usage: npm run adr:rename <file_name_or_number> "<New Title>"'
    );
    process.exit(1);
  }

  if (!fs.existsSync(ADRS_DIR)) {
    console.error(`ADR directory not found: ${ADRS_DIR}`);
    process.exit(1);
  }

  // Find target file
  const files = fs.readdirSync(ADRS_DIR).filter((f) => f.endsWith('.md'));

  const targetFile = files.find(
    (f) => f === target || f === `${target}.md` || f.startsWith(`${target}-`)
  );

  if (!targetFile) {
    console.error(`Could not find ADR matching: ${target}`);
    process.exit(1);
  }

  const removedMatch = targetFile.match(/^(\d{4})-(.*)\.md$/);
  if (!removedMatch) {
    console.error(
      `File ${targetFile} does not match expected serial format (DDDD-...).`
    );
    process.exit(1);
  }

  const serialStr = removedMatch[1]; // e.g. "0005"

  const kebabDesc = toKebabCase(newTitle);
  const newFileName = `${serialStr}-${kebabDesc}.md`;

  if (targetFile === newFileName) {
    console.log(`The file is already named ${newFileName}.`);
    process.exit(0);
  }

  // 1. Rename the file using git mv (fallback to fs.renameSync if not tracked yet)
  try {
    runCmd(`git mv docs/adrs/${targetFile} docs/adrs/${newFileName}`);
  } catch (e) {
    console.warn(
      `\nWarning: 'git mv' failed (file might not be tracked). Attempting local rename.`
    );
    fs.renameSync(
      path.join(ADRS_DIR, targetFile),
      path.join(ADRS_DIR, newFileName)
    );
    console.log(`Renamed locally: docs/adrs/${newFileName}`);
  }

  // 2. Update the internal markdown header
  const filePath = path.join(ADRS_DIR, newFileName);
  let content = fs.readFileSync(filePath, 'utf8');

  // Safely replace the main markdown header (e.g. # ADR 0005: Old Title -> # ADR 0005: New Title)
  content = content.replace(
    /^#\s+ADR\s+\d{4}:.*$/m,
    `# ADR ${serialStr}: ${newTitle}`
  );
  fs.writeFileSync(filePath, content, 'utf8');

  // 3. Update the index table in 09_architecture_decisions.md
  if (fs.existsSync(INDEX_FILE)) {
    let indexContent = fs.readFileSync(INDEX_FILE, 'utf8');
    let lines = indexContent.split('\n');

    // Find the row matching the renamed ADR
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`[ADR-${serialStr}]`)) {
        // e.g. | [ADR-0005](./adrs/0005-old.md) | Old Title | Status |
        const parts = lines[i].split('|');
        if (parts.length >= 4) {
          parts[1] = parts[1].replace(targetFile, newFileName);

          // Compute simple padding for aesthetics if needed, but standard is fine
          parts[2] = ` ${newTitle.padEnd(56)} `;

          lines[i] = parts.join('|');
        }
      }
    }

    fs.writeFileSync(INDEX_FILE, lines.join('\n'), 'utf8');
    console.log(`\nSuccessfully updated docs/09_architecture_decisions.md`);
  }

  console.log(`\nFormatting files with Prettier...`);
  execSync(
    'npx prettier --write "docs/adrs/*.md" "docs/09_architecture_decisions.md"',
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
