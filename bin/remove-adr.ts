import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ADRS_DIR = path.join(__dirname, '../docs/adrs');
const INDEX_FILE = path.join(__dirname, '../docs/09_architecture_decisions.md');

function runCmd(cmd: string) {
  console.log(`Running: ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: npm run adr:remove <file_name_or_number>');
    process.exit(1);
  }

  if (!fs.existsSync(ADRS_DIR)) {
    console.error(`ADR directory not found: ${ADRS_DIR}`);
    process.exit(1);
  }

  // Find target file
  const files = fs
    .readdirSync(ADRS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const targetFile = files.find(
    (f) => f === target || f === `${target}.md` || f.startsWith(`${target}-`)
  );

  if (!targetFile) {
    console.error(`Could not find ADR matching: ${target}`);
    process.exit(1);
  }

  const removedMatch = targetFile.match(/^(\d{4})-/);
  if (!removedMatch) {
    console.error(
      `File ${targetFile} does not match expected serial format (DDDD-...).`
    );
    process.exit(1);
  }

  const removedSerialNum = parseInt(removedMatch[1], 10);
  const removedSerialStr = removedMatch[1]; // e.g. "0005"

  // 1. Remove the file using git rm (fallback to fs.unlinkSync if not tracked yet)
  try {
    runCmd(`git rm docs/adrs/${targetFile}`);
  } catch (e) {
    console.warn(
      `\nWarning: 'git rm' failed (file might not be tracked). Attempting local delete.`
    );
    fs.unlinkSync(path.join(ADRS_DIR, targetFile));
    console.log(`Deleted locally: docs/adrs/${targetFile}`);
  }

  // 2. Identify files to shift
  const remainingFiles = files.filter((f) => f !== targetFile);
  const shiftedFiles = [];

  for (const file of remainingFiles) {
    const match = file.match(/^(\d{4})-(.*)$/);
    if (!match) continue;

    const num = parseInt(match[1], 10);
    if (num > removedSerialNum) {
      const newNumStr = String(num - 1).padStart(4, '0');
      const newName = `${newNumStr}-${match[2]}`;
      shiftedFiles.push({
        oldName: file,
        newName,
        oldNumStr: match[1],
        newNumStr,
      });
    }
  }

  // 3. Shift files and update their internal titles
  for (const shift of shiftedFiles) {
    // Git move (fallback to fs.renameSync)
    try {
      runCmd(`git mv docs/adrs/${shift.oldName} docs/adrs/${shift.newName}`);
    } catch (e) {
      console.warn(`\nWarning: 'git mv' failed. Attempting local rename.`);
      fs.renameSync(
        path.join(ADRS_DIR, shift.oldName),
        path.join(ADRS_DIR, shift.newName)
      );
    }

    // Update inside the file: # ADR 0006 -> # ADR 0005
    const filePath = path.join(ADRS_DIR, shift.newName);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace the main markdown header
    content = content.replace(
      `# ADR ${shift.oldNumStr}:`,
      `# ADR ${shift.newNumStr}:`
    );
    fs.writeFileSync(filePath, content, 'utf8');
  }

  // 4. Update the index table in 09_architecture_decisions.md
  if (fs.existsSync(INDEX_FILE)) {
    let content = fs.readFileSync(INDEX_FILE, 'utf8');
    let lines = content.split('\n');

    // Remove the row matching the deleted ADR
    lines = lines.filter((line) => !line.includes(`[ADR-${removedSerialStr}]`));

    // Update the shifted rows
    for (let i = 0; i < lines.length; i++) {
      for (const shift of shiftedFiles) {
        if (lines[i].includes(`[ADR-${shift.oldNumStr}]`)) {
          lines[i] = lines[i]
            .replace(`[ADR-${shift.oldNumStr}]`, `[ADR-${shift.newNumStr}]`)
            .replace(`/adrs/${shift.oldName}`, `/adrs/${shift.newName}`);
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
