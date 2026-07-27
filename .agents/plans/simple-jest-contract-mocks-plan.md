# Simple Jest Contract Mocks Plan

## Goal

Make every shared `*.mock.ts` test double a declaration-only collection of
`jest.fn()` methods, move configured return values, callback execution, and
stateful fake behavior into the specs that require them, and add a durable
testing rule that prevents future shared mocks from embedding behavior.

This plan is implementation-ready. Preserve all unrelated staged and
working-tree changes during implementation.

## Context

The repository's general testing rules prefer shared mocks, but do not define
how behaviorless those mocks must remain. An audit of all 60 `*.mock.ts` files
found four shared mocks with default behavior. Their consumers currently rely
on a mixture of explicit per-spec configuration and implicit behavior inherited
from the shared module.

Shared mock files should define the contract surface only. A spec owns the
return values, rejections, callback execution, and state transitions needed for
its scenario. Stateful test doubles are fakes and should not be hidden behind a
shared mock name.

## Confirmed Findings

1. **High — the cache-storage mock is a stateful in-memory fake.**
   `src/shared/contracts/__mocks__/cache-storage.mock.ts` owns a `Map`, supplies
   implementations for every method, and uses `any`. Token-service and
   email-verification-service specs depend on that stateful behavior.
2. **High — the repository-service mock executes transaction callbacks.**
   `src/shared/contracts/__mocks__/repo.mock.ts` invokes callbacks with a cast
   transaction value and uses `Promise<any>`. Multiple application specs rely
   on this default to exercise work inside a transaction.
3. **Medium — the application-context mock supplies shared fixture data.**
   `src/app/_internal/contracts/__mocks__/app-context.mock.ts` configures `get`
   with a global context object. This creates implicit cross-spec inputs; at
   least the logout spec documents a dependency on its hard-coded correlation
   ID.
4. **Low — the balance-propagation mock supplies a default resolution.**
   `src/app/bookkeeping/contracts/__mocks__/ledger-account-balance-adjustment-service.mock.ts`
   configures `propagate` with `mockResolvedValue(undefined)` instead of leaving
   the scenario behavior to each consuming spec.
5. **The durable rule has a gap.** `.agents/rules/testing/general.md` says to
   prefer shared mocks but does not prohibit implementations, state, default
   results, or fixture values inside shared `*.mock.ts` modules.

## Scope

### Expected Changes

- `.agents/rules/testing/general.md` — add the canonical rule for
  declaration-only shared mocks and spec-owned behavior.
- `src/shared/contracts/__mocks__/cache-storage.mock.ts` — replace the factory
  and in-memory store with one typed mock object containing only `jest.fn()`
  methods.
- `src/shared/contracts/__mocks__/repo.mock.ts` — remove transaction callback
  execution and unsafe casts; retain only a typed `runInTransaction: jest.fn()`.
- `src/app/_internal/contracts/__mocks__/app-context.mock.ts` — remove the
  default `get` result while retaining plain context and client-session Jest
  mocks.
- `src/app/bookkeeping/contracts/__mocks__/ledger-account-balance-adjustment-service.mock.ts`
  — replace the configured promise result with `jest.fn()`.
- `src/app/auth/services/__specs__/token.service.spec.ts` and
  `src/app/auth/services/__specs__/email-verification.service.spec.ts` — import
  the plain cache mock, reset it between tests, and configure the stateful cache
  semantics locally when a scenario genuinely needs them.
- Application specs importing `src/shared/contracts/__mocks__/repo.mock.ts` —
  configure transaction callback execution in each relevant `beforeEach`, and
  keep scenario-specific rejection overrides in the individual test.
- Application specs importing
  `src/app/_internal/contracts/__mocks__/app-context.mock.ts` — reset shared
  functions and configure `get` explicitly wherever the subject reads context;
  replace comments or assertions coupled to the former global fixture.
- Journal-entry and ledger specs importing the balance-propagation mock — reset
  `propagate` and explicitly resolve it in scenarios whose workflow should
  continue successfully.

### Out of Scope

- Replacing all Jest mocks with factories or changing the repository's shared
  mock import convention.
- Moving spec-local stateful helpers into shared `*.mock.ts` files.
- Refactoring unrelated test fixtures, production services, contracts, or IoC.
- Changing the two aggregate modules that use `Object.freeze` only to group
  otherwise plain Jest mocks; they do not implement contract behavior.

## Proposed Approach

### 1. Establish the durable testing rule

- Add a concise `Shared Mocks` section to
  `.agents/rules/testing/general.md`, which the testing skill already requires
  agents to read.
- Require shared `*.mock.ts` files to expose typed contract shapes whose methods
  are bare `jest.fn()` calls.
- Prohibit function implementations, internal state, default return/resolved or
  rejected values, embedded fixtures, and behavior-producing factories in
  shared mock modules.
- Require each owning spec to reset shared mocks and configure return values,
  rejections, and implementations in `beforeEach` or in the specific test that
  needs them.
- Clarify that a stateful or behaviorally realistic test double is a fake and
  must remain spec-local unless a separate, explicitly governed fake convention
  is introduced.

### 2. Simplify the four shared mocks

- Preserve each contract's existing typed surface and exports where practical,
  but remove every behavior-producing expression.
- Export cache storage as a typed singleton mock, matching the event-bus,
  hasher, and token-codec pattern; update its two consumers away from
  `makeMockCacheStorage()`.
- Type the repo mock directly as `jest.Mocked<IRepoService>` so removing its
  callback implementation also removes `any` and the double cast.
- Leave `mockClientSession` as a collection of bare Jest functions, because it
  is part of the app-context contract fixture surface, but remove the configured
  `mockAppContext.get` value.

### 3. Make behavior explicit in consuming specs

- In the token-service spec, keep any in-memory cache model and helper functions
  inside that spec, then attach them with `mockImplementation` during setup.
  This preserves concurrency, claim, deletion, and expiry scenarios without
  making the shared mock a fake.
- In the email-verification-service spec, configure only the cache results and
  state transitions needed by its three scenarios; do not depend on the token
  spec's helper.
- In every transaction-owning spec, configure `runInTransaction` to call its
  callback with the spec's typed transaction fixture. Specs that only assert
  rejection may configure a rejection directly instead.
- In every context-consuming spec, define or reuse a nearby typed context
  fixture and configure `mockAppContext.get` explicitly. Reset context and
  client-session mocks before configuration to prevent cross-test leakage.
- In each balance-propagation consumer, explicitly configure the successful
  resolved result in setup, leaving error-path overrides next to the relevant
  scenario.

### 4. Re-audit the convention

- Inspect all `*.mock.ts` files after the edits and confirm none contains
  `mockReturnValue`, `mockResolvedValue`, `mockRejectedValue`,
  `mockImplementation`, a callback passed to `jest.fn`, internal mutable state,
  or behavior-producing factories.
- Confirm that behavior remains in specs rather than being moved to another
  shared mock file under a different name.

## Test Plan

- **Application unit:** run the token-service and email-verification-service
  specs to preserve cache set/get/delete, exclusive-claim, and expiry behavior.
- **Application unit:** run every spec related to the repo mock to preserve
  transaction callback execution, transaction propagation, and rejection
  scenarios.
- **Application unit:** run every spec related to the app-context and
  balance-propagation mocks to catch missing explicit fixtures or promise
  configuration.
- **Regression:** run the complete Jest suite because the app-context and repo
  mocks are imported across authentication, accounting, ledger, money,
  bookkeeping, subledger, and user tests.
- No new production tests are required; this change relocates test setup without
  changing production behavior.

## Verification

Run focused mock-dependent tests first, then the complete suite and static
checks.

```bash
npm test -- --runInBand --findRelatedTests src/shared/contracts/__mocks__/cache-storage.mock.ts src/shared/contracts/__mocks__/repo.mock.ts src/app/_internal/contracts/__mocks__/app-context.mock.ts src/app/bookkeeping/contracts/__mocks__/ledger-account-balance-adjustment-service.mock.ts
npm test -- --runInBand
npm run lint
npm run build
rg -n "mock(Return|Resolved|Rejected|Implementation)|jest\\.fn\\([^)]|new Map|Promise<any>" -g "*.mock.ts" src
git diff --check
```

The final `rg` check should return no behavioral shared mocks; any match must be
reviewed and removed or demonstrated to be a false positive.

## Risks

- Shared singleton mocks retain call history and one-off implementations unless
  each consumer resets them. Mitigate by adding explicit resets before default
  per-spec configuration.
- The stateful cache fake currently encodes atomic claim semantics used by token
  tests. A simplistic sequence of resolved values could weaken those tests;
  retain the state model locally in the token-service spec.
- Transaction callbacks may silently stop executing if a consumer is missed.
  Use related-test discovery plus the full test suite to find every implicit
  dependency.
- Fake timers in token specs can leak if a test fails before restoring real
  timers. Preserve or improve timer cleanup while relocating cache setup.

## Completion Criteria

- All four identified shared mocks contain only typed bare `jest.fn()` methods
  and structural grouping/export code.
- No shared `*.mock.ts` file contains configured results, implementations,
  internal state, embedded fixture values, or behavior-producing factories.
- All affected specs explicitly reset and configure the behavior they require.
- `.agents/rules/testing/general.md` clearly enforces declaration-only shared
  mocks and spec-owned behavior for future agents.
- Focused related tests, the full Jest suite, lint, build, the mock audit, and
  `git diff --check` pass.
- Production behavior and unrelated working-tree changes remain unchanged.
