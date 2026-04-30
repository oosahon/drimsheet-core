# PR Review Workflow

When requested to review a Pull Request or a set of branch changes, you must strictly follow this reporting format. Your goal is to provide a comprehensive, constructive, and highly accurate analysis of the code changes.

**IMPORTANT: You must output the final report under the `## Agent Feedback` heading in the `pr-review-report.md` file. DO NOT overwrite the entire file or modify the original ticket details at the top of the file. Simply append or insert your report under the existing `## Agent Feedback` heading.**

## Reporting Format

Generate the PR review report using the exact headings below:

### 1. What we are doing well

Highlight positive aspects of the changes. Focus on:

- Good architectural decisions or clean refactoring.
- Effective use of design patterns or adherence to project conventions.
- Improvements to performance, security, or error handling.
- Well-structured test coverage.

### 2. What we could improve

Identify areas for enhancement that aren't strictly bugs but affect code quality, maintainability, or long-term stability. Focus on:

- **Use of `any`**: You MUST always flag the use of the `any` keyword in TypeScript. Strict typing should be enforced.
- **Uncovered Test Cases**: You MUST always flag untested edge cases, missing unit tests, or logic that lacks sufficient coverage.
- Code duplication or opportunities for abstraction.
- Magic strings, hardcoded values, or unused/dead code.
- Non-adherence to established project rules or repository patterns.

### 3. Bugs and their severity

Report actual bugs, logic errors, or regressions introduced by the changes. For each bug, provide:

- **Severity**: (Low, Medium, High, Critical)
- **Location**: The file and context where the bug occurs.
- **Description**: What the exact bug is and why it happens.
- **Impact**: The potential consequence of the bug on the system or user.

## General Review Guidelines

- Be concise but thorough.
- Base your review strictly on the provided code diffs and repository context.
- Prioritize providing actionable feedback.
