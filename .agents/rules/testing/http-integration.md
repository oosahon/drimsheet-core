# HTTP Integration Specs

## File Naming

- Put HTTP integration specs under `test/http/<feature>`.
- Name each file `<endpoint>.<verb>.spec.ts`, using a lowercase HTTP verb; for
  example, `login-with-email.post.spec.ts`.

## Suite Structure

- Name each top-level `describe` block `<VERB> <endpoint>`.
- Group tests immediately beneath the endpoint by expected HTTP status code,
  using numeric `describe` blocks such as `describe('200 Response')` or
  `describe('422 Response')`.
- Put a test that exercises multiple response statuses under the status that
  represents its primary expected outcome.

## Coverage

- Exercise the assembled HTTP boundary with Supertest.
- Assert status, response contract, headers, and relevant security behavior.
- Verify invalid requests are rejected before orchestration when applicable.
- Mock external boundaries or use cases, not Express request/response behavior.

Follow [General Testing](general.md).
