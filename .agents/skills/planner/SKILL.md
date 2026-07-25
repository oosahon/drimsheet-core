---
name: planner
description: Use whenever the user asks for a plan, implementation plan, approach, roadmap, or planning, and whenever the agent decides to create or present a plan before doing work.
---

# Planner

## Required workflow

1. Read [the implementation plan template](../../templates/implementation-plan.md).
2. Inspect the repository enough to distinguish confirmed findings from
   assumptions and open decisions.
3. Create the plan in `.agents/plans` using the template as its structure.
4. Name the file `<concise-kebab-case-outcome>-plan.md`.
5. Remove template sections that do not apply; do not leave placeholders.
6. Present or summarize the saved plan and link to its path.

Do not provide a plan only in chat. Save it before presenting it. Preserve
unrelated working-tree and staged changes.
