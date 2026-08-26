# Blackblaze File Upload Plan

## Goal

Allow an authenticated Web client to request a short-lived Blackblaze
presigned `PUT` URL from Core and upload file bytes directly to B2. Core accepts
and returns JSON only; it never receives multipart data or file bytes.

This plan sets up file upload only. It does not connect uploaded files to any
action, domain, or database table. This plan is implementation-ready. Preserve
unrelated staged and working-tree changes during implementation.

## Context

Core has no file-upload endpoint or Blackblaze runtime integration today. The
repository already defines the file metadata returned after an upload as
`IFileAttachment` in `src/shared/values/file-attachments`, with the shape
`{ url, name, type, size }` and existing validation/errors.

The repository's integration rule places named external-platform code under
`src/infra/integrations/<provider>`, while TSOA controllers remain delivery-only
and call application usecases. Blackblaze's S3-compatible API supports the
required direct browser `PUT` flow.

## Confirmed Findings

1. **The file metadata contract already exists.**
   `src/shared/values/file-attachments/file-attachment.vo.ts` validates the
   stable URL, name, MIME type, and positive size required in the upload result.
2. **Core currently has no binary upload path.** Existing controllers accept
   typed request bodies and no multipart middleware or upload controller exists.
3. **Blackblaze is not wired into runtime code.** `IVarsConfig`,
   `vars.config.ts`, dependencies, integrations, and IoC contain no B2 client.
4. **The existing provider placement is explicit.** Named integrations such as
   `cbn`, `launchdarkly`, and `zeptomail` live below
   `src/infra/integrations`.
5. **No persistence change is needed for upload setup.** Issuing a presigned URL
   and returning metadata requires no database write, repository, migration, or
   transaction.

## Implementation Basis

| Change                                                     | Basis                                    | Current consumer              | Evidence or rationale                               |
| ---------------------------------------------------------- | ---------------------------------------- | ----------------------------- | --------------------------------------------------- |
| Reuse `IFileAttachment` and `fileAttachmentValue`          | Existing shared owner                    | File upload response          | `src/shared/values/file-attachments`                |
| Add an application usecase and TSOA controller             | Usecase and controller rules             | Authenticated Web upload flow | Existing `src/app` and HTTP controller structure    |
| Name the controller `file.controller.ts`                   | User-resolved decision                   | File upload endpoint          | Explicit review decision                            |
| Put the B2 adapter in `src/infra/integrations/blackblaze`  | Named external-platform integration rule | File upload usecase           | Existing `src/infra/integrations/<provider>` layout |
| Add no persistence, action integration, or attachment flow | Explicit scope restriction               | File upload only              | The requested outcome ends when Web has uploaded B2 |

## Scope

### Expected Changes

- `package.json` and lockfile — add the AWS S3-compatible client and request
  presigner required to sign Blackblaze `PUT` requests.
- `src/shared/contracts/vars-config.contract.ts`,
  `src/infra/config/vars.config.ts`, and config tests — expose the B2 application
  key ID, application key, bucket, endpoint, and region required by the client.
- `src/app/file/` — add the JSON upload request/response DTOs, validation,
  Blackblaze client contract, upload usecase, stable error mapping, and tests.
- `src/interface/http/controllers/file.controller.ts` — expose the authenticated
  JSON endpoint and delegate to the upload usecase.
- `src/infra/integrations/blackblaze/` — configure the S3-compatible client and
  presign `PutObject` requests.
- `src/infra/ioc/` — compose the Blackblaze client and file-upload usecase.
- `generated/swagger.json`, `generated/routes.ts`, and exported error keys —
  regenerate the public Core contract through repository scripts.
- deployment documentation — document B2 environment variables, scoped
  credentials, bucket configuration, and the Web-origin CORS rule.

### Out of Scope

- Journal entries, receipts, bank accounts, outflow, transfer, or any other
  action.
- Any action DTO, mapper, usecase, repository, transaction, or table.
- Database migrations or persistence of upload/file records.
- A file-attachment domain, entity, ID, lifecycle, status, or global store.
- Multipart handling, proxying bytes through Core, completion callbacks,
  `HeadObject`, download URLs, deletion, or abandoned-upload cleanup.
- File processing such as scanning, OCR, resizing, thumbnails, or EXIF work.
- New file-type, count, or byte-size policies beyond validating the existing
  metadata shape.

## Proposed Approach

### 1. Add the upload contract and usecase

- Add `POST /files/upload` with a JSON body containing `name`, `type`, and
  `size`.
- Validate the request at the DTO boundary and generate an opaque object key in
  Core. The client cannot provide the bucket or object key.
- Inject the small Blackblaze client contract into the upload usecase. The
  contract exposes only the presign operation required by this endpoint; no
  generic provider registry or storage factory is added.
- Return an upload response containing:
  - the expiring `uploadUrl`;
  - the exact headers Web must send with the `PUT`;
  - an `IFileAttachment` created by `fileAttachmentValue.make`, using the stable
    Blackblaze object URL rather than the expiring signed URL.
- Do not persist the request or response.

### 2. Implement the Blackblaze adapter

- Configure one S3-compatible client under
  `src/infra/integrations/blackblaze` with the B2 endpoint, region, bucket, and
  scoped application credentials.
- Presign a `PutObject` command for the Core-generated key and submitted content
  type using a short internal expiry constant.
- Map SDK failures to the app-owned file-upload error without exposing
  credentials, signed query strings, or raw provider details.
- Implement no list, read, head, delete, copy, or multipart operations.

### 3. Expose and document the endpoint

- Add `src/interface/http/controllers/file.controller.ts` with the existing
  authentication middleware and JSON request/response DTOs.
- Regenerate TSOA routes, Swagger, and error keys.
- Document the B2 bucket CORS rule allowing the deployed Web origins, `PUT`, and
  the headers returned by Core.

## Test Plan

- **DTO/usecase:** cover valid metadata, invalid name/type/size, opaque-key
  generation, exact adapter input, returned `IFileAttachment`, and safe provider
  error mapping.
- **Blackblaze adapter:** mock the S3 client/presigner and assert endpoint,
  region, bucket, key, content type, expiry, required headers, and stable object
  URL without contacting B2.
- **Configuration:** cover B2 variable mapping and immutable runtime config.
- **HTTP:** cover authentication, JSON validation, successful upload
  instructions, and mapped failures. Confirm no multipart handler is added.
- **Regression:** existing controllers, shared file-attachment validation, and
  generated routes remain unchanged outside the new endpoint.

## Verification

```bash
npm test -- --runInBand src/app/file src/infra/integrations/blackblaze
npm test -- --runInBand test/http/file
npm run build:routes
npm run export:errors
npm run lint
npm run build
```

A live smoke test requires a non-production B2 bucket, scoped credentials, and
its Web-origin CORS rule. Automated tests must mock Blackblaze and must not
contact the live service.

## Assumptions

- The configured B2 bucket provides a stable object URL suitable for
  `IFileAttachment.url`; read authorization is separate from this upload-only
  plan.
- Files fit in a single presigned `PUT`; multipart object upload is not required.

## Risks

- A browser upload fails if the signed headers and bucket CORS rule differ. Core
  returns the required headers and deployment documentation records the same
  rule.
- Anyone with an unexpired presigned URL can use that specific upload grant.
  Keep the expiry short, generate opaque keys, and keep the endpoint
  authenticated.
- Uploaded files can remain unused because no action association or cleanup is
  part of this scope.

## Completion Criteria

- An authenticated client can request a JSON upload instruction from
  `POST /files/upload`.
- Web can use the instruction to upload bytes directly to Blackblaze with
  `PUT`; Core never accepts file bytes or multipart data.
- Core returns the existing `IFileAttachment` metadata shape and does not
  persist it.
- The implementation uses `src/interface/http/controllers/file.controller.ts`
  and `src/infra/integrations/blackblaze`.
- No journal-entry, receipt, action, domain, repository, transaction, table, or
  migration changes are introduced.
- Focused tests, generated contracts, lint, and build pass; unrelated files and
  behavior remain unchanged.

## Implementation Status

| Slice                                  | Owner           | Basis and precedent                                                   | Intended files and tests                                           | Status                                                        |
| -------------------------------------- | --------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| Upload contract and usecase            | App             | Current direct-upload requirement; existing DTO/usecase patterns      | `src/app/file/**`                                                  | Complete — focused tests pass                                 |
| Blackblaze presigning adapter          | Infra           | Named integration rule; existing provider folders                     | `src/infra/integrations/blackblaze/**`, dependencies, config       | Complete — focused adapter/config tests pass                  |
| Authenticated file endpoint and IoC    | Interface/Infra | User-selected controller path; existing TSOA and usecase IoC patterns | `file.controller.ts`, `src/infra/ioc/usecases/file.ts`, HTTP specs | Complete — generated route and HTTP tests pass                |
| Generated contract and operations docs | Interface/Docs  | Repository generation scripts and deployment documentation            | `generated/**`, error keys, README/deployment docs                 | Complete — generated artifacts and B2 operations docs updated |
| Reconciliation and verification        | Cross-cutting   | Implement-plan workflow                                               | Focused tests, lint, build, final diff                             | Complete — scope reconciled and required checks pass          |

## Implementation Result

Implemented without deviation.

- App, adapter, and configuration suites: 21 tests passed.
- New app/adapter behavior: 100% statements, branches, functions, and lines.
- File HTTP suite: 6 tests passed with 100% controller coverage.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:names`: the repository-wide check remains blocked by the
  pre-existing `src/infra/persistence/helpers/__tests__/get-db-query.test.ts`
  naming mismatch; every file added by this implementation follows the required
  naming convention.
- No journal-entry, receipt, action, domain, repository, transaction, database,
  or migration file was changed.
