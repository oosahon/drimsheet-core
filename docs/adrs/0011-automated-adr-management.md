# ADR 0011: Automated ADR Management

## Status

Accepted

## Context

Maintaining an Architectural Decision Record (ADR) log requires strict sequential numbering, properly formatted boilerplate, and linking newly created records to the centralized `09_architecture_decisions.md` index. Doing this manually often leads to broken numbering sequences, forgotten index additions, or mismatched git histories when names change or files are progressively removed.

## Decision

We actively manage our ADRs using highly-deterministic node scripts integrated into our `package.json` utilizing `tsx`.

- Creating an ADR: `npm run adr:add "<description>"`
- Removing an ADR: `npm run adr:remove <filename-or-serial>`

All ADR modifications MUST be executed through these scripts to ensure serial numbering is preserved (through auto-shifting via `git mv` on removal) and the central index table remains perfectly synchronized.

## Consequences

### Positive

- Zero manual effort to configure files and titles.
- Removes human error in misnumbering ADRs or forgetting to index them.
- `adr:remove` elegantly preserves git history through `git mv` when shifting existing files natively to fill a collapsed numbering gap.

### Negative

- Requires `tsx` locally.
- Direct file manipulation of ADRs bypassing these tools will break the automation's assumptions.
