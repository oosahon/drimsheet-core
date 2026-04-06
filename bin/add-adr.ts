import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Because we are likely running in a CommonJS env based on tsconfig/package,
// __dirname is usually available natively. But if tsx treats it loosely, this approach works.
const ADRS_DIR = path.join(__dirname, '../docs/adrs');
const INDEX_FILE = path.join(__dirname, '../docs/09_architecture_decisions.md');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function toKebabCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '');
}

async function main() {
  let description = process.argv[2];

  if (!description) {
    description = await new Promise((resolve) => {
      rl.question('Enter ADR title / description: ', (answer) => {
        resolve(answer.trim());
      });
    });
  }
  rl.close();

  if (!description) {
    console.error('Error: Description is required.');
    process.exit(1);
  }

  // 1. Get the highest serial number
  if (!fs.existsSync(ADRS_DIR)) {
    fs.mkdirSync(ADRS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(ADRS_DIR).filter((f) => f.endsWith('.md'));
  let maxSerial = 0;
  for (const file of files) {
    const match = file.match(/^(\d{4})-/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSerial) maxSerial = num;
    }
  }

  const nextSerial = String(maxSerial + 1).padStart(4, '0');
  const kebabDesc = toKebabCase(description);
  const fileName = `${nextSerial}-${kebabDesc}.md`;
  const filePath = path.join(ADRS_DIR, fileName);

  // 2. Create the markdown file
  const template = `# ADR ${nextSerial}: ${description}

## Status
Proposed

## Context
<!-- Describe the forces at play, the technological or business problem, etc. -->

## Decision
<!-- The exact architectural decision made -->

## Consequences
### Positive
- 

### Negative
- 
`;

  fs.writeFileSync(filePath, template, 'utf8');
  console.log(`Created new ADR file: ${filePath}`);

  // 3. Update the index table
  if (fs.existsSync(INDEX_FILE)) {
    let content = fs.readFileSync(INDEX_FILE, 'utf8');
    const newRow = `| [ADR-${nextSerial}](./adrs/${fileName}) | ${description} | Proposed |\n`;

    // Append the row cleanly to the bottom of the table
    content = content.trimEnd() + '\n' + newRow;
    fs.writeFileSync(INDEX_FILE, content, 'utf8');
    console.log(`Added ADR link to docs/09_architecture_decisions.md`);
  } else {
    console.warn(`Warning: Could not find ${INDEX_FILE} to update.`);
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
