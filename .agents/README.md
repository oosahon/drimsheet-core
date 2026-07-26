# Agent Files

- `../AGENTS.md`: root entrypoint for all agents.
- `skills/<name>/SKILL.md`: task entrypoints with `name` and `description` frontmatter.
- `rules/`: durable project constraints. Keep them concise.
- `workflow/`: ordered procedures for common tasks.
- `plans/`: one-time plans, investigations, and implementation notes.

Keep rules centralized. Skills should link to rules and workflows, not duplicate them.

Durable rules and the current repository take precedence over saved plans.
Revalidate a plan before implementation.
