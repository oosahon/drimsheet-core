# Absolute Layer Import Aliases Plan

## Implementation Status

| Slice                                       | Owner and basis                                                                                   | Intended files and tests                                                                                                       | Status                                                                                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Record the durable convention               | Repository guidance; explicit plan decision and existing layer rule                               | `AGENTS.md`, `.agents/rules/import-paths.md`, `.agents/rules/pr-review.md`, `.agents/workflow/implementation.md`               | Complete                                                                                                                                                                                         |
| Establish resolver configuration            | Tooling; explicit plan decision and current TypeScript/Jest/Nodemon entry points                  | `tsconfig.json`, `jest.config.js`, `nodemon.json`, `package.json`, `package-lock.json`                                         | Complete — type-check and lint resolution pass; explicit relative paths and `rootDir` replace deprecated `baseUrl`; ESLint uses config-relative resolver and project paths for IDE compatibility |
| Rewrite production aliases after emit       | Build tooling; explicit plan decision and plain-Node `start` precedent                            | `package.json`, `package-lock.json`, `scripts/check-built-import-aliases.mjs`; canonical build and emitted-output scan         | Pending plan-drift decision — emit, rewrite, scan, and plain-Node graph load pass; TSOA generation needs alias compiler options                                                                  |
| Migrate authored imports                    | Owning source/test layers; explicit plan decision and `.agents/rules/folder-responsibility.md`    | `src/**/*.ts`, `test/**/*.ts`; TypeScript, Jest, and target-resolution validation                                              | Complete — 4,578 resolved specifiers rewritten; test type-check passes                                                                                                                           |
| Enforce and regression-test import spelling | Repository lint policy; explicit plan decision and existing `eslint.config.mjs` enforcement point | `eslint.config.mjs`, `scripts/check-import-path-policy.mjs`, `package.json`; lint policy examples and existing boundary checks | Complete — lint and focused policy checks pass                                                                                                                                                   |
| Reconcile and verify                        | Repository-wide                                                                                   | Lint, test type-check, Jest, build, emitted alias scan, plain-Node graph load                                                  | Pending                                                                                                                                                                                          |

## Goal

Replace non-local relative imports that target the five application layers in
authored application and test TypeScript with these standard aliases:

- `@domain/`
- `@app/`
- `@infra/`
- `@interface/`
- `@shared/`

Allow relative imports only for direct sibling modules in the same directory,
and enforce the convention so files can move without requiring chains of
`../../..` updates.

The plan is implementation-ready. The requested aliases and build requirement
provide the basis for the new repository-wide convention. Preserve unrelated
staged and working-tree changes during implementation.

## Context

The repository emits CommonJS with `tsc`, runs production output with plain
Node, uses `ts-node` through Nodemon in development, and transforms tests with
`ts-jest`. Alias resolution therefore has to work consistently during type
checking, development, tests, generation, compilation, and execution of built
JavaScript.

The five aliases correspond directly to the layer roots in
`.agents/rules/folder-responsibility.md`. The aliases standardize import
spelling; the existing ESLint boundary policies continue to control which
layers are allowed to depend on each other.

## Confirmed Findings

1. **Build-blocking — TypeScript paths do not make emitted imports executable.**
   `tsconfig.json` emits CommonJS into `dist`, and `npm start` executes the
   result with plain Node. TypeScript can resolve `paths` while compiling but
   does not rewrite those specifiers, so the canonical build needs a post-emit
   rewrite.
2. **Each execution path currently has different resolution behavior.**
   `tsconfig.json` has no `baseUrl` or `paths`; Jest contains only an unused
   `@/` mapping; and `nodemon.json` invokes plain `ts-node`, which does not apply
   TypeScript path mappings to Node resolution by itself.
3. **The migration is broad.** There are 4,255 parent-relative import statements
   across 850 of the 915 TypeScript files under `src`, plus 175 in `test`.
4. **Lint does not enforce the requested convention.** `eslint.config.mjs`
   currently enforces layer direction for `src/**/*.ts`, but it has no relative
   import restriction and the `npm run lint` command does not include
   `test/**/*.ts`.
5. **No durable agent rule currently defines import spelling.**
   `.agents/rules/folder-responsibility.md` defines layer ownership and allowed
   dependencies, while `.agents/rules/pr-review.md` asks reviewers to check
   boundaries. Neither records the five aliases or the sibling exception.

## Scope

### Expected Changes

- `tsconfig.json` — define the five wildcard aliases against their `src` layer
  roots.
- `package.json` and `package-lock.json` — add build-time and development-time
  alias resolution, extend lint to authored tests, and keep these behaviors in
  the canonical project commands.
- `nodemon.json` — preload the resolver required by the existing `ts-node`
  development process. This file changes because TypeScript `paths` alone do
  not affect Node's runtime module resolution.
- `jest.config.js` — replace the unused broad `@/` mapping with the five
  supported mappings.
- `eslint.config.mjs` — add explicit authored-source and authored-test import
  restrictions while preserving the existing layer-boundary rules. This file
  changes because it is the existing enforcement point for TypeScript import
  policy; configuration alone in `tsconfig.json` would not forbid `../` imports.
- `src/**/*.ts` and `test/**/*.ts` — migrate imports and re-exports whose targets
  are not direct siblings to their owning layer alias.
- `.agents/rules/import-paths.md` — introduce the single durable source of truth
  for alias names, the sibling-relative exception, and scope.
- `AGENTS.md` — add the import-path rule to the rules agents must always follow.
- `.agents/rules/pr-review.md` — require reviewers to check import-path
  compliance and link to the canonical rule.
- `.agents/workflow/implementation.md` — link the import-path rule from the
  ordinary code-change workflow so implementations validate new imports before
  completion.

### Out of Scope

- The generated-route flow, including its artifact, configuration, location,
  generated imports, and existing application integration import.
- `db/**` migration internals, JavaScript tooling, and shell scripts. The five
  requested aliases describe `src` layers and do not provide truthful roots for
  these areas.
- New aliases such as `@generated/`, `@db/`, or a broad `@/` catch-all.
- Barrel files, module ownership changes, or changes to allowed layer dependency
  direction.

## Proposed Approach

### 1. Record the durable convention

- Add `.agents/rules/import-paths.md` with a concise policy:
  - authored `src` and `test` code uses the five named aliases for non-sibling
    modules;
  - only direct `./sibling` imports may remain relative;
  - parent imports and nested relative traversal are forbidden;
  - aliases never override layer-boundary rules;
  - the rule governs imports targeting the five aliased `src` roots;
  - database migrations and tooling remain outside the rule until purpose-built
    aliases are explicitly approved.
- Add the rule to `AGENTS.md` as an always-follow rule. Link it from
  `.agents/workflow/implementation.md` rather than copying its contents.
- Update `.agents/rules/pr-review.md` to check the convention and link to the
  same canonical rule. Leave `.agents/rules/folder-responsibility.md` unchanged:
  it already owns layer placement and dependency direction, not import syntax.

### 2. Establish one resolver contract

- Add `baseUrl: "."` and these mappings in `tsconfig.json`:

  ```json
  {
    "@domain/*": ["src/domain/*"],
    "@app/*": ["src/app/*"],
    "@infra/*": ["src/infra/*"],
    "@interface/*": ["src/interface/*"],
    "@shared/*": ["src/shared/*"]
  }
  ```

- Mirror the mappings in Jest's `moduleNameMapper` and remove the unused `@/`
  mapping so there is no undocumented sixth alias.
- Add `tsconfig-paths` and preload it from the existing Nodemon `ts-node`
  command. This preserves the current development architecture while teaching
  Node how to resolve the TypeScript aliases.

### 3. Make the production build independent of runtime hooks

- Add `tsc-alias` as a development dependency and invoke it immediately after
  `tsc` in `npm run build`.
- Keep `npm start` as plain Node. The emitted application must contain rewritten
  relative CommonJS specifiers and must not require `tsconfig-paths` in
  production.
- Add a build verification command or script that fails when any of the five
  aliases remains in emitted JavaScript.

### 4. Migrate authored imports safely

- Use an AST-aware or TypeScript-aware codemod to resolve each current import
  target before changing its specifier. Convert type-only imports, static
  imports, side-effect imports, and re-exports.
- Express every non-sibling target under `src/domain`, `src/app`, `src/infra`,
  `src/interface`, or `src/shared` through its matching alias.
- Keep `./module` only when the resolved target is a direct sibling in the same
  directory. Convert `../module` and `./nested/module` to aliases.
- Review layer-sized batches for changed targets, filename-case errors,
  accidental barrels, and aliases that obscure an existing boundary violation.

### 5. Enforce the policy

- Extend ESLint and the `npm run lint` file selection to authored
  `test/**/*.ts` as well as `src/**/*.ts`.
- Add a restricted-import rule covering imports and re-exports that rejects
  `../...` and nested `./directory/...` specifiers, permits direct siblings, and
  applies when the resolved target belongs to one of the five aliased roots.
- Keep out-of-scope files outside the authored-code rule. Preserve all current
  `eslint-plugin-boundaries` policies.
- Add a focused policy check using ESLint's programmatic API or repository test
  script so the allowed and forbidden examples cannot regress through a future
  configuration edit.

## Test Plan

- **Static policy:** verify `../module` and `./nested/module` fail; `./sibling`
  and all five aliases pass; and existing prohibited layer dependencies still
  fail.
- **Unit/integration:** run the existing Jest suite to exercise alias resolution
  in co-located unit tests and `test/http` integration tests.
- **Build/runtime:** build via the canonical command, assert no alias prefix
  remains in `dist/**/*.js`, and load the emitted application graph with plain
  Node.

## Verification

```bash
npm run lint
npx tsc --project tsconfig.test.json --noEmit
npm test -- --runInBand
npm run build
rg "@(domain|app|infra|interface|shared)/" dist --glob "*.js"
npm start
```

The `rg` command must return no matches. `npm start` is an environment-backed
smoke check because full bootstrap requires the application's normal
configuration and backing services.

## Assumptions

- “Same directory” means a direct sibling such as `./currency.error`, not a
  parent import or `./helpers/currency.error` nested traversal.

## Risks

- Rewriting thousands of imports can select a wrong same-named target. Resolve
  targets before rewriting and validate after each layer-sized batch.
- Resolver duplication can drift across TypeScript, Jest, development, and the
  emitted build. Treat `tsconfig.json` as canonical and cover every execution
  path in verification.
- A deployment path that bypasses `npm run build` could omit the post-emit
  rewrite and fail with `MODULE_NOT_FOUND`. Keep rewriting inside the canonical
  build command and scan `dist` for unresolved aliases.

## Completion Criteria

- The five aliases resolve during type checking, Jest, development, and the
  production build.
- Authored `src/**/*.ts` and `test/**/*.ts` imports targeting one of the five
  layer roots contain no parent or nested relative imports or re-exports.
- ESLint rejects new forbidden paths, permits direct siblings, preserves layer
  boundaries, and leaves out-of-scope targets unchanged.
- `npm run build` rewrites aliases, leaves no alias prefixes in emitted
  JavaScript, and the built graph resolves under plain Node.
- The import convention is recorded once in `.agents/rules/import-paths.md` and
  linked from `AGENTS.md`, implementation workflow, and PR-review guidance.
- Lint, type checking, existing tests, and build verification pass with
  unrelated behavior unchanged.
