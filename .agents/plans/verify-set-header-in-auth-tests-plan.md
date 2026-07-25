# Verify setHeader in Auth Integration Tests Plan

## Goal

Verify that `this.setHeader('Cache-Control', 'no-store')` is properly asserted in HTTP integration tests under `test/http/auth/`. If not, add assertions or add missing integration tests to ensure coverage.

State: Implementation-ready.

## Context

The codebase sets `Cache-Control: no-store` on sensitive authentication endpoints via `this.setHeader('Cache-Control', 'no-store')` in `src/interface/http/controllers/auth.controller.ts` and `res.setHeader('Cache-Control', 'no-store')` in `src/interface/http/middlewares/google-oauth.middleware.ts`.

After reviewing the integration tests under `test/http/auth/`, we verified the following:

1. `POST /auth/login-with-email` (asserted in `login-with-email.post.spec.ts`)
2. `POST /auth/signup/complete` (asserted in `signup-complete.post.spec.ts`)
3. `POST /auth/reset-password` (asserted in `reset-password.post.spec.ts`)
4. `POST /auth/refresh-access-token` (asserted in `refresh-access-token.post.spec.ts`)
5. `POST /auth/logout` (asserted in `logout.post.spec.ts`)
6. `GET /auth/google` (asserted in `login-with-google.get.spec.ts`)
7. `GET /auth/google/callback` (asserted in `login-with-google-callback.get.spec.ts`)

However:

- The `POST /auth/get-password-reset-link` endpoint is NOT tested in `test/http/auth/` at all. As a result, its `this.setHeader('Cache-Control', 'no-store')` behavior is not tested.

## Confirmed Findings

1. **Missing Integration Test** — `POST /auth/get-password-reset-link` lacks any integration tests under `test/http/auth/`.
2. **Existing Assertions Present** — All other endpoints where `setHeader('Cache-Control', 'no-store')` is invoked are already verified in their respective spec files.

## Scope

### Expected Changes

- [NEW] [get-password-reset-link.post.spec.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/test/http/auth/get-password-reset-link.post.spec.ts) — Create this file to implement integration tests for the `POST /auth/get-password-reset-link` endpoint, including validation, rate limiting, error sanitization, and the presence of `Cache-Control: no-store` header.

## Proposed Approach

### Step 1: Create Integration Test File

- Create `test/http/auth/get-password-reset-link.post.spec.ts` modeled after other auth Spec files.
- The tests will cover:
  - **200 Response**: Calls the use case, returns success status, and asserts that the `Cache-Control` header contains `no-store`.
  - **422 Response**: Rejects invalid payloads (e.g. missing email, invalid email format) before invoking the use case.
  - **429 Response**: Enforces rate limiting (both account-based and IP-based) on repeated attempts.
  - **500 Response**: Sanitizes unexpected errors (ensures email or database details are not leaked in the error response).

## Test Plan

- **HTTP Integration**: Create integration tests using Supertest in `test/http/auth/get-password-reset-link.post.spec.ts` targeting `POST /api/v1/auth/get-password-reset-link`.

## Verification

Run the new tests and verify they pass:

```bash
npm test test/http/auth/get-password-reset-link.post.spec.ts
```

Run all auth integration tests to verify no regressions:

```bash
npm test test/http/auth/
```

## Completion Criteria

- [ ] `get-password-reset-link.post.spec.ts` is created and all tests pass.
- [ ] The `Cache-Control: no-store` header is explicitly asserted in the 200 response of the new test suite.
- [ ] All other integration tests under `test/http/auth/` continue to pass.
