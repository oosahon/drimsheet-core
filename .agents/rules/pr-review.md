# PR Review

Review for bugs first.

## Always Check

- Correctness regressions and missed edge cases.
- Security issues and secret exposure.
- Layer ownership and import boundaries.
- Import-path compliance with [Import Paths](import-paths.md).
- Repositories doing more than storage/retrieval.
- Controllers, middlewares, or use cases making hidden business decisions.
- Structural decisions without an explicit requirement or resolved plan
  decision, durable rule, concrete precedent, or explicitly approved deviation.
- Speculative behaviors, configuration, abstractions, compatibility paths, or
  hooks without a present consumer, as prohibited by
  [Scope And Simplicity](scope-and-simplicity.md).
- Undisclosed plan drift and material plan deviations that lack approval. Allow
  disclosed non-material corrections that preserve the approved outcome and
  scope.
- `any`, unsafe casts, dead code, magic strings, and duplicated logic.
- Missing or weak tests for changed behavior.

Report findings with severity, file, line, impact, and a concrete fix direction.
