# Plan Implementation Workflow

Use this when implementing, resuming, or completing a saved plan. Follow the
[ordinary implementation workflow](implementation.md) and
[precedent and deviation rule](../rules/precedent-and-deviation.md) throughout.

## Before Editing

1. Identify the exact governing plan and read it completely, including its
   scope, assumptions, open decisions, risks, verification, and completion
   criteria.
2. Capture the working-tree and staged baseline. Distinguish existing user
   changes from work required by the plan and preserve unrelated changes.
3. Confirm that the plan is implementation-ready. Validate every material
   assumption. If any material decision remains unresolved or an assumption is
   invalid, stop before all implementation edits and have the plan resolved or
   split; do not partially implement it.
4. Revalidate each plan step against durable rules and the current repository.
   Current rules and established local patterns take precedence over the plan.
5. Prepare an execution ledger for each plan step containing:
   - the behavior or outcome and its owner;
   - its requirement, rule, concrete precedent, or approved deviation;
   - the intended files and tests; and
   - its completion and verification status.
6. Cite paths and symbols for concrete precedents. If no suitable precedent
   exists, or the plan conflicts with current code, follow the precedent and
   deviation rule before implementing that part.
7. Give the user a concise pre-edit update covering readiness, validated
   assumptions, preserved boundaries, and any disclosed deviation.

Do not edit until this preflight is complete.

## During Implementation

8. For a repository-owned saved plan, keep the authoritative execution ledger
   in an `Implementation Status` section in that plan and update it before source
   edits and after each slice. When the plan is external or read-only, use the
   task's plan state, tell the user it is not persisted in the repository, and
   do not create a separate tracking file without approval.
9. Implement the smallest coherent slice that satisfies the next plan step.
10. Keep optional improvements and unrelated cleanup out of scope.
11. Update the execution ledger after each slice and compare the emerging diff
    with the baseline, plan scope, and intended files.
12. When new evidence invalidates the plan or requires a new pattern, stop that
    part of the work and apply the plan-drift or no-precedent gate before
    proceeding.
13. Run focused validation for each slice, followed by the broader checks
    justified by the plan's risk.

## Completion

14. Reconcile every plan step and completion criterion with the final diff and
    verification evidence.
15. Confirm that unrelated baseline changes remain untouched and that no
    out-of-scope files were added to the implementation.
16. Report incomplete items, unavailable checks, and approved deviations. State
    `Implemented without deviation` when none occurred.
