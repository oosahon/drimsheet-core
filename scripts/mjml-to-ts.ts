import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'out',
]);

function toCamelCase(name: string): string {
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

function findTemplates(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE.has(entry.name)) continue;
      results.push(...findTemplates(full));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.mjml')) {
      results.push(full);
    }
  }

  return results;
}

function extractParams(source: string): string[] {
  const re = /\{{2,3}\s*([a-zA-Z0-9_]+)\s*\}{2,3}/g;
  const seen = new Set<string>();
  const params: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(source)) !== null) {
    const name = m[1];
    if (!seen.has(name)) {
      seen.add(name);
      params.push(name);
    }
  }

  return params;
}

function compileMjml(mjmlPath: string): string {
  const localBin = path.join(
    ROOT,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'mjml.cmd' : 'mjml'
  );

  let html = '';
  if (fs.existsSync(localBin)) {
    html = execFileSync(localBin, [mjmlPath], { encoding: 'utf8' });
  } else {
    html = execFileSync('npx', ['--yes', 'mjml', mjmlPath], {
      encoding: 'utf8',
    });
  }

  // Minify to html and remove MJML CLI FILE comment
  html = html
    .replace(/<!-- FILE: .*? -->/g, '')
    .replace(/>\s+</g, '><')
    .trim();
  return html;
}

async function formatWithPrettier(code: string, filePath: string) {
  try {
    const prettier = await import('prettier');
    const config = await prettier.resolveConfig(filePath);
    return prettier.format(code, { ...config, parser: 'typescript' });
  } catch (err) {
    return code;
  }
}

async function buildTs(
  functionName: string,
  params: string[],
  html: string,
  outPath: string
): Promise<string> {
  const escapedHtml = html
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  let code;

  if (params.length === 0) {
    code = `/**
 * AUTO-GENERATED FILE. DO NOT EDIT.
 */
export default function ${functionName}(): string {
  return \`${escapedHtml}\`;
}
`;
  } else {
    const iface = params.map((p) => `  ${p}: string;`).join('\n');

    code = `/**
 * AUTO-GENERATED FILE. DO NOT EDIT.
 */
export interface IParam {
${iface}
}

export default function ${functionName}(params: IParam): string {
  let html = \`${escapedHtml}\`;
  for (const [key, value] of Object.entries(params)) {
    const rx = new RegExp(\`\\\\{{2,3}\\\\s*\${key}\\\\s*\\\\}{2,3}\`, 'g');
    html = html.replace(rx, value as string);
  }
  return html;
}
`;
  }

  return formatWithPrettier(code, outPath);
}

async function run() {
  const templates = findTemplates(ROOT);

  if (!templates.length) {
    console.log('No .mjml files found.');
    return;
  }

  for (const mjmlPath of templates) {
    const source = fs.readFileSync(mjmlPath, 'utf8');
    const params = extractParams(source);

    const baseName = path.basename(mjmlPath, '.mjml');
    let functionName = toCamelCase(baseName);
    if (!functionName.endsWith('Template')) {
      functionName += 'Template';
    }

    const html = compileMjml(mjmlPath);
    const outPath = path.join(path.dirname(mjmlPath), `${baseName}.ts`);

    const formatted = await buildTs(functionName, params, html, outPath);

    fs.writeFileSync(outPath, formatted, 'utf8');

    console.log(
      `✓ ${path.relative(ROOT, outPath)} -> ${functionName}(${
        params.length > 0 ? params.join(', ') : 'no params'
      })`
    );
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
