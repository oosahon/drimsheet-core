import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.dirname(fileURLToPath(import.meta.url));
const typescriptResolver = createRequire(import.meta.url).resolve(
  'eslint-import-resolver-typescript'
);

const layer = (type, pattern) => ({
  type,
  pattern,
  partialMatch: false,
});

const layerRoots = ['domain', 'app', 'infra', 'interface', 'shared'].map(
  (layerName) => path.join(repositoryRoot, 'src', layerName)
);

const targetsLayerRoot = (filename, specifier) => {
  const target = path.resolve(path.dirname(filename), specifier);

  return layerRoots.some((root) => {
    const relativeTarget = path.relative(root, target);
    return !relativeTarget.startsWith('..') && !path.isAbsolute(relativeTarget);
  });
};

const layerImportPaths = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require layer aliases except for direct sibling imports.',
    },
    messages: {
      useAlias:
        'Use the owning layer alias; relative imports are limited to direct siblings.',
    },
    schema: [],
  },
  create(context) {
    const checkSource = (node) => {
      const specifier = node.source?.value;

      if (typeof specifier !== 'string' || !specifier.startsWith('.')) return;

      const isParent = specifier.startsWith('../');
      const isNestedSibling =
        specifier.startsWith('./') && specifier.slice(2).includes('/');

      if (
        (isParent || isNestedSibling) &&
        targetsLayerRoot(context.filename, specifier)
      ) {
        context.report({ node: node.source, messageId: 'useAlias' });
      }
    };

    return {
      ExportAllDeclaration: checkSource,
      ExportNamedDeclaration: checkSource,
      ImportDeclaration: checkSource,
    };
  },
};

export default [
  {
    ignores: ['coverage/**', 'dist/**', 'generated/**', 'node_modules/**'],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    plugins: {
      local: {
        rules: {
          'layer-import-paths': layerImportPaths,
        },
      },
    },
    rules: {
      'local/layer-import-paths': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: [
      'src/infra/server/index.ts',
      'src/infra/runtime/_bootstrap/**/*.ts',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      boundaries,
    },
    settings: {
      'import/resolver': {
        [typescriptResolver]: {
          project: path.join(repositoryRoot, 'tsconfig.json'),
        },
      },
      'boundaries/elements': [
        layer('domain', 'src/domain'),
        layer('app', 'src/app'),
        layer('infra', 'src/infra'),
        layer('interface', 'src/interface'),
        layer('shared', 'src/shared'),
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          checkInternals: false,
          policies: [
            {
              from: { element: { types: 'domain' } },
              disallow: {
                element: {
                  types: { anyOf: ['app', 'infra', 'interface'] },
                },
              },
              message:
                'Domain code may only import from src/domain or src/shared.',
            },
            {
              from: { element: { types: 'app' } },
              disallow: {
                element: {
                  types: { anyOf: ['infra', 'interface'] },
                },
              },
              message:
                'App code may only import from src/shared, src/domain, or src/app.',
            },
            {
              from: { element: { types: 'infra' } },
              disallow: {
                element: {
                  types: { anyOf: ['interface'] },
                },
              },
              message:
                'Infra code may only import from src/shared, src/app, src/domain, or src/infra.',
            },
            {
              from: { element: { types: 'shared' } },
              disallow: {
                element: {
                  types: { anyOf: ['domain', 'app', 'infra', 'interface'] },
                },
              },
              message: 'Shared code may only import from src/shared.',
            },
          ],
        },
      ],
    },
  },
];
