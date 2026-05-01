const fs = require('fs');
const path = require('path');

const files = [
  'src/interface/http/middlewares/google-oauth.middleware.ts',
  'src/interface/http/middlewares/is-authenticated-user.middleware.ts',
  'src/interface/http/handlers/__test__/error.handler.test.ts',
  'src/interface/http/handlers/error.handler.ts',
  'src/interface/http/helpers/__tests__/get-accounting-entity-from-request.helper.test.ts',
  'src/interface/http/helpers/get-accounting-entity-from-request.helper.ts',
  'src/infra/config/rate-limiter.config.ts',
  'src/app/mappers/money.mapper.ts',
  'src/app/usecases/accounting/create-accounting-entity.usecase.ts',
  'src/app/usecases/bookkeeping/create-ledger-account-balance.usecase.ts',
  'src/app/usecases/bookkeeping/record-opening-balance.usecase.ts',
  'src/app/usecases/auth/refresh-access-token.usecase.ts',
  'src/app/usecases/auth/signup-with-email.usecase.ts',
  'src/app/usecases/auth/__specs__/verify-email.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/login-with-email.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/refresh-access-token.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/signup-with-email.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/send-email-verification-email.usecase.spec.ts',
  'src/app/usecases/auth/helpers/oauth-handler-google.helper.ts',
  'src/app/usecases/internal/get-sent-email.usecase.ts',
  'src/app/usecases/user/__specs__/get-preferences.usecase.spec.ts',
  'src/app/usecases/user/__specs__/get-profile.usecase.spec.ts',
  'src/app/usecases/user/get-preferences.usecase.ts',
  'src/app/usecases/user/get-profile.usecase.ts',
  'src/shared/utils/zod-validation-runner.ts',
  'src/app/errors/__tests__/http.errors.test.ts',
];

const errorNames = [
  'ErrorBadRequest',
  'ErrorUnauthorized',
  'ErrorPaymentRequired',
  'ErrorForbidden',
  'ErrorResourceNotFound',
  'ErrorConflict',
  'ErrorUnprocessableEntity',
  'ErrorTooManyRequests',
  'ErrorInternalServerError',
];

files.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // 1. Find imports of these errors and rewrite to import httpError
  // Looks like: import { ErrorBadRequest, IApiValidationError } from '../../app/errors/http.errors';
  const importRegex =
    /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+http\.errors)['"];?/g;
  content = content.replace(importRegex, (match, importsStr, modulePath) => {
    let imports = importsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    let hasHttpError = false;
    let otherImports = [];

    imports.forEach((imp) => {
      if (errorNames.includes(imp)) {
        hasHttpError = true;
      } else {
        otherImports.push(imp);
      }
    });

    if (hasHttpError) {
      changed = true;
      if (otherImports.length > 0) {
        return `import httpError, { ${otherImports.join(', ')} } from '${modulePath}';`;
      } else {
        return `import httpError from '${modulePath}';`;
      }
    }
    return match;
  });

  // 2. Rewrite usages: ErrorBadRequest -> httpError.BadRequest
  errorNames.forEach((err) => {
    const regex = new RegExp(`\\b${err}\\b`, 'g');
    if (regex.test(content)) {
      changed = true;
      const subName = err.replace('Error', '');
      content = content.replace(regex, `httpError.${subName}`);
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
