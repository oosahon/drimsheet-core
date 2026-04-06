import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ADRS_DIR = path.join(__dirname, '../docs/adrs');
const INDEX_FILE = path.join(__dirname, '../docs/09_architecture_decisions.md');

async function main() {
  if (!fs.existsSync(ADRS_DIR)) {
    console.error(`ADR directory not found: ${ADRS_DIR}`);
    return;
  }

  const files = fs
    .readdirSync(ADRS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
  const rows = [];

  for (const file of files) {
    const match = file.match(/^(\d{4})-(.*)\.md$/);
    if (!match) continue;

    const serialNum = match[1];
    const filePath = path.join(ADRS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract Title
    let title = 'Unknown Title';
    const titleMatch = content.match(/^#\s+ADR\s+\d{4}:\s*(.*)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // Extract Status
    let status = 'Proposed';
    const statusMatch = content.match(/^##\s+Status\s*\n+([^\n]+)/m);
    if (statusMatch) {
      status = statusMatch[1].trim();
    }

    // Format table row, padding the title arbitrarily for nice raw markdown alignment
    const row = `| [ADR-${serialNum}](./adrs/${file}) | ${title.padEnd(56)} | ${status} |`;
    rows.push(row);
  }

  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Index file not found: ${INDEX_FILE}`);
    return;
  }

  let indexContent = fs.readFileSync(INDEX_FILE, 'utf8');

  const lines = indexContent.split('\n');
  const newLines = [];
  let inTableBody = false;
  let tableReplaced = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect the start of the Markdown Table header
    if (
      line.match(/^\|\s*ID\s*\|/i) &&
      lines[i + 1]?.match(/^\|\s*[-]+\s*\|/)
    ) {
      newLines.push(line);
      newLines.push(lines[i + 1]);
      newLines.push(...rows); // Insert newly generated rows

      inTableBody = true;
      tableReplaced = true;
      i++; // Skip the divider line since we handled it
      continue;
    }

    if (inTableBody) {
      // Exit table body mode when we hit a line that isn't a table row
      if (!line.trim().startsWith('|')) {
        inTableBody = false;
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  if (tableReplaced) {
    fs.writeFileSync(INDEX_FILE, newLines.join('\n'), 'utf8');
    console.log(
      `Successfully synced ${rows.length} ADRs to docs/09_architecture_decisions.md`
    );
  } else {
    // Fallback if no table header was found at all
    const tableStr =
      `\n| ID                                                              | Title                                                    | Status   |\n| --------------------------------------------------------------- | -------------------------------------------------------- | -------- |\n` +
      rows.join('\n') +
      '\n';
    fs.writeFileSync(
      INDEX_FILE,
      indexContent.trimEnd() + '\n' + tableStr,
      'utf8'
    );
    console.log(
      `Generated new table with ${rows.length} ADRs in docs/09_architecture_decisions.md`
    );
  }

  console.log(`\nFormatting files with Prettier...`);
  execSync(
    'npx prettier --write "docs/adrs/*.md" "docs/09_architecture_decisions.md"',
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );
}

main().catch(console.error);
