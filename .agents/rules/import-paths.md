# Import Paths

Authored TypeScript under `src` and `test` uses these aliases for imports and
re-exports targeting the five application layers:

- `@domain/` for `src/domain/`
- `@app/` for `src/app/`
- `@infra/` for `src/infra/`
- `@interface/` for `src/interface/`
- `@shared/` for `src/shared/`

Use a relative path only for a direct sibling in the same directory, such as
`./currency.error`. Parent paths such as `../currency.error` and nested paths
such as `./helpers/currency.error` must use the owning layer alias.

Aliases standardize spelling; they do not relax the dependency directions in
[Folder Responsibility](folder-responsibility.md). Database migrations,
generated artifacts, and tooling remain outside this rule until purpose-built
aliases are approved.

## Formatting

Prettier orders imports into these groups, separated by one blank line:

1. Node native modules.
2. Third-party packages.
3. `@shared/`.
4. `@domain/`.
5. `@app/`.
6. `@infra/`.
7. `@interface/`.
8. Relative direct siblings.

Keep `.prettierrc` as the executable source of this ordering.
