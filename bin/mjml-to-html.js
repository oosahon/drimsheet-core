#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const prettier = require('prettier');

const ROOT = process.cwd();
const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'out',
]);

function toCamelCase(name) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

function findTemplates(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE.has(entry.name)) continue;
      results.push(...findTemplates(full));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('template.mjml')) {
      results.push(full);
    }
  }

  return results;
}

function extractParams(source) {
  const re = /\$\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}/g;
  const seen = new Set();
  const params = [];
  let m;

  while ((m = re.exec(source)) !== null) {
    const name = m[1];
    if (!seen.has(name)) {
      seen.add(name);
      params.push(name);
    }
  }

  return params;
}

function escapeTemplateLiteral(str) {
  return str.replace(/`/g, '\\`');
}

function compileMjml(mjmlPath) {
  const localBin = path.join(
    ROOT,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'mjml.cmd' : 'mjml'
  );

  if (fs.existsSync(localBin)) {
    return execFileSync(localBin, [mjmlPath], { encoding: 'utf8' });
  }

  return execFileSync('npx', ['--no-install', 'mjml', mjmlPath], {
    encoding: 'utf8',
  });
}

async function formatWithPrettier(code, filePath) {
  const config = await prettier.resolveConfig(filePath);
  return prettier.format(code, {
    ...config,
    parser: 'typescript',
  });
}

async function buildTs({ functionName, params, html, outPath }) {
  const escapedHtml = escapeTemplateLiteral(html);

  let code;

  if (params.length === 0) {
    code = `
/**
 * AUTO-GENERATED FILE. DO NOT EDIT.
 */
export default function ${functionName}(): string {
  return \`${escapedHtml}\`;
}
`;
  } else {
    const iface = params.map((p) => `  ${p}: string;`).join('\n');
    const destructured = params.join(', ');

    code = `
/**
 * AUTO-GENERATED FILE. DO NOT EDIT.
 */
interface IParams {
${iface}
}

export default function ${functionName}({ ${destructured} }: IParams): string {
  return \`${escapedHtml}\`;
}
`;
  }

  return formatWithPrettier(code, outPath);
}

async function run() {
  const templates = findTemplates(ROOT);

  if (!templates.length) {
    console.log('No **/*template.mjml files found.');
    return;
  }

  for (const mjmlPath of templates) {
    const source = fs.readFileSync(mjmlPath, 'utf8');
    const params = extractParams(source);

    const parentDir = path.basename(path.dirname(mjmlPath));
    const functionName = toCamelCase(parentDir);

    const html = compileMjml(mjmlPath);
    const outPath = path.join(path.dirname(mjmlPath), 'template.ts');

    const formatted = await buildTs({
      functionName,
      params,
      html,
      outPath,
    });

    fs.writeFileSync(outPath, formatted, 'utf8');

    console.log(
      `✓ ${path.relative(
        ROOT,
        outPath
      )} -> ${functionName}(${params.join(', ') || 'no params'})`
    );
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
