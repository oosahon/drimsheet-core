# PR Review

Review for bugs first.

## Always Check

- Correctness regressions and missed edge cases.
- Security issues and secret exposure.
- Layer ownership and import boundaries.
- Repositories doing more than storage/retrieval.
- Controllers, middlewares, or use cases making hidden business decisions.
- `any`, unsafe casts, dead code, magic strings, and duplicated logic.
- Missing or weak tests for changed behavior.

Report findings with severity, file, line, impact, and a concrete fix direction.
