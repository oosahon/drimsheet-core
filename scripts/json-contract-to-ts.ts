import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

type JsonSchema = {
  type?: string | string[];
  const?: unknown;
  enum?: unknown[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema | JsonSchema[];
  additionalProperties?: boolean | JsonSchema;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
};

// Recursive function to walk directories and find all *.contract.json files
function findContractJsonFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (
        file === 'node_modules' ||
        file === '.git' ||
        file === 'dist' ||
        file === 'coverage' ||
        file === '.agent' ||
        file === '.vscode' ||
        file === '.github'
      ) {
        continue;
      }
      findContractJsonFiles(filePath, fileList);
    } else if (file.endsWith('.contract.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Convert filename (e.g. domain-event.contract.json) to interface name (e.g. IDomainEvent)
function getInterfaceName(filename: string): string {
  const base = filename.replace(/\.contract\.json$/, '');
  const segments = base.split(/[.-]/);
  const pascalCase = segments
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('');
  return `I${pascalCase}`;
}

function escapePropertyName(key: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function literalToTsType(value: unknown): string {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return JSON.stringify(value);
  }

  return 'unknown';
}

function isJsonSchema(value: unknown): value is JsonSchema {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    return false;
  }

  const schema = value as Record<string, unknown>;
  return (
    'const' in schema ||
    'enum' in schema ||
    'properties' in schema ||
    'items' in schema ||
    'oneOf' in schema ||
    'anyOf' in schema ||
    'allOf' in schema ||
    (typeof schema.type === 'string' &&
      [
        'array',
        'boolean',
        'integer',
        'null',
        'number',
        'object',
        'string',
      ].includes(schema.type)) ||
    (Array.isArray(schema.type) &&
      schema.type.every((type) => typeof type === 'string'))
  );
}

function schemaObjectToTsType(schema: JsonSchema, indentLevel: number): string {
  const indent = ' '.repeat(indentLevel);
  const nextIndent = ' '.repeat(indentLevel + 2);
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const fields = Object.entries(properties).map(([key, propertySchema]) => {
    const optional = required.has(key) ? '' : '?';
    const valueType = jsonToTsType(propertySchema, indentLevel + 2);
    return `${nextIndent}${escapePropertyName(key)}${optional}: ${valueType};`;
  });

  if (schema.additionalProperties && schema.additionalProperties !== true) {
    const valueType = jsonToTsType(
      schema.additionalProperties,
      indentLevel + 2
    );
    fields.push(`${nextIndent}[key: string]: ${valueType};`);
  } else if (schema.additionalProperties === true && fields.length === 0) {
    return 'Record<string, unknown>';
  }

  if (fields.length === 0) {
    return 'Record<string, unknown>';
  }

  return `{\n${fields.join('\n')}\n${indent}}`;
}

function jsonSchemaToTsType(schema: JsonSchema, indentLevel: number): string {
  if ('const' in schema) {
    return literalToTsType(schema.const);
  }

  if (schema.enum) {
    return schema.enum.map(literalToTsType).join(' | ') || 'never';
  }

  if (schema.oneOf) {
    return schema.oneOf
      .map((item) => jsonToTsType(item, indentLevel))
      .join(' | ');
  }

  if (schema.anyOf) {
    return schema.anyOf
      .map((item) => jsonToTsType(item, indentLevel))
      .join(' | ');
  }

  if (schema.allOf) {
    return schema.allOf
      .map((item) => jsonToTsType(item, indentLevel))
      .join(' & ');
  }

  if (Array.isArray(schema.type)) {
    return schema.type
      .map((type) => jsonSchemaToTsType({ ...schema, type }, indentLevel))
      .join(' | ');
  }

  switch (schema.type) {
    case 'object':
      return schemaObjectToTsType(schema, indentLevel);
    case 'array': {
      if (Array.isArray(schema.items)) {
        const tupleItems = schema.items.map((item) =>
          jsonToTsType(item, indentLevel)
        );
        return `[${tupleItems.join(', ')}]`;
      }
      const itemType = schema.items
        ? jsonToTsType(schema.items, indentLevel)
        : 'unknown';
      return `Array<${itemType}>`;
    }
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'string':
      return 'string';
    default:
      if (schema.properties) {
        return schemaObjectToTsType(schema, indentLevel);
      }
      return 'unknown';
  }
}

// Convert concrete contract values and embedded JSON Schemas to TypeScript types.
function jsonToTsType(value: unknown, indentLevel = 0): string {
  const indent = ' '.repeat(indentLevel);
  const nextIndent = ' '.repeat(indentLevel + 2);

  if (isJsonSchema(value)) {
    return jsonSchemaToTsType(value, indentLevel);
  }

  if (value === null) {
    return 'unknown';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'unknown[]';
    }
    const elementTypes = [...new Set(value.map((item) => jsonToTsType(item)))];
    const elementType =
      elementTypes.length === 1 ? elementTypes[0] : elementTypes.join(' | ');
    return `Array<${elementType}>`;
  }

  if (typeof value === 'object') {
    const fields = Object.entries(value).map(([key, fieldValue]) => {
      const valueType = jsonToTsType(fieldValue, indentLevel + 2);
      return `${nextIndent}${escapePropertyName(key)}: ${valueType};`;
    });

    if (fields.length === 0) {
      return 'Record<string, unknown>';
    }

    return `{\n${fields.join('\n')}\n${indent}}`;
  }

  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }

  return 'unknown';
}

function generateContract(jsonPath: string): void {
  const dir = path.dirname(jsonPath);
  const filename = path.basename(jsonPath);
  const tsFilename = filename.replace(/\.contract\.json$/, '.contract.ts');
  const tsPath = path.join(dir, tsFilename);

  console.log(`Processing: ${jsonPath} -> ${tsPath}`);

  try {
    const rawJson = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(rawJson);
    const interfaceName = getInterfaceName(filename);
    const tsType = jsonToTsType(parsed, 0);

    const relativeJsonPath = path.relative(process.cwd(), jsonPath);
    const content = `// Generated from ${relativeJsonPath}. Do not modify directly.

export default interface ${interfaceName} ${tsType}
`;

    fs.writeFileSync(tsPath, content, 'utf8');

    // Run prettier on the generated file to ensure it matches project formatting
    try {
      execSync(`npx prettier --write "${tsPath}"`, { stdio: 'ignore' });
    } catch (err) {
      console.warn(`Warning: Could not format ${tsPath} with prettier.`);
    }
  } catch (err: any) {
    console.error(`Error processing ${jsonPath}:`, err.message);
  }
}

function main() {
  const files = findContractJsonFiles(process.cwd());
  if (files.length === 0) {
    console.log('No .contract.json files found.');
    return;
  }

  for (const file of files) {
    generateContract(file);
  }
  console.log('Done.');
}

main();
