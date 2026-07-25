# Agent Guide

Read this before changing the repository.

## Start Here

1. Read `.agents/README.md`.
2. Load the skill for the task from `.agents/skills/<skill>/SKILL.md`.
3. For code changes, follow `.agents/workflow/implementation.md`.
4. Always follow `.agents/rules/folder-responsibility.md`.

## Planning

- Whenever the user asks for a plan or the agent decides to create or present
  one, load `.agents/skills/planner/SKILL.md`.
- Create every plan from `.agents/templates/implementation-plan.md` and save it
  under `.agents/plans`.

## Core Rules

- Put behavior in the folder that owns it.
- Keep repositories limited to data storage and retrieval.
- Keep controllers, middlewares, and use cases orchestration-only.
- Use domain entities/values/services or app policies for decisions.
- Keep rules concise. Link to existing rules instead of duplicating them.
- Do not invent architecture when local rules or patterns already exist.

## Skills

Skills are directories with a `SKILL.md` file. Use YAML frontmatter with `name`
and `description`. Keep skill bodies short and link to centralized rules and
workflows.
