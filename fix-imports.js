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
  'src/app/usecases/accounting/__specs__/create-accounting-entity.usecase.spec.ts',
  'src/app/usecases/bookkeeping/__specs__/record-opening-balance.usecase.spec.ts',
  'src/app/usecases/bookkeeping/__specs__/create-ledger-account-balance.usecase.spec.ts',
  'src/app/usecases/bookkeeping/create-ledger-account-balance.usecase.ts',
  'src/app/usecases/bookkeeping/record-opening-balance.usecase.ts',
  'src/app/usecases/auth/refresh-access-token.usecase.ts',
  'src/app/usecases/auth/signup-with-email.usecase.ts',
  'src/app/usecases/auth/__specs__/verify-email.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/login-with-email.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/refresh-access-token.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/request-password-reset.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/signup-with-email.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/send-email-verification-email.usecase.spec.ts',
  'src/app/usecases/auth/helpers/__tests__/oauth-handler-google.helper.test.ts',
  'src/app/usecases/auth/helpers/oauth-handler-google.helper.ts',
  'src/app/usecases/internal/get-sent-email.usecase.ts',
  'src/app/usecases/internal/__specs__/get-sent-email.usecase.spec.ts',
  'src/app/usecases/user/__specs__/get-preferences.usecase.spec.ts',
  'src/app/usecases/user/__specs__/get-profile.usecase.spec.ts',
  'src/app/usecases/user/get-preferences.usecase.ts',
  'src/app/usecases/user/get-profile.usecase.ts',
  'src/shared/utils/__tests__/error.test.ts',
  'src/shared/utils/zod-validation-runner.ts',
  'src/shared/utils/error.ts',
];

const symbolsToMove = [
  'IApiValidationError',
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
  if (file === 'src/shared/utils/error.ts') return; // we handle this manually

  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');

  // Find import from .*shared/utils/error
  const importRegex =
    /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]*shared\/utils\/error)['"];?/g;

  let changed = false;

  content = content.replace(importRegex, (match, importsStr, modulePath) => {
    const imports = importsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const movedImports = [];
    const keptImports = [];

    imports.forEach((imp) => {
      // Handle "import { something as somethingElse }" just in case
      const baseName = imp.split(/\s+as\s+/)[0];
      if (symbolsToMove.includes(baseName)) {
        movedImports.push(imp);
      } else {
        keptImports.push(imp);
      }
    });

    if (movedImports.length === 0) return match;

    changed = true;

    // figure out how to import `@/app/errors/http.errors`
    // Usually absolute alias is `@/app/errors/http.errors`
    // But some files might be using relative imports. Let's just use `@/app/errors/http.errors`
    // Wait, in this project do they use `@/...`? Let's check the match.
    let newImportLine = `import { ${movedImports.join(', ')} } from '@/app/errors/http.errors';`;
    if (modulePath.startsWith('.')) {
      // It's a relative import. We can use `@/app/errors/http.errors` uniformly if alias is setup
      // Let's check if `@/app/...` is valid by assuming it is (standard).
      // If kept imports is not empty, return both
      if (keptImports.length > 0) {
        return `import { ${keptImports.join(', ')} } from '${modulePath}';\n${newImportLine}`;
      }
      return newImportLine;
    } else {
      // Also alias
      if (keptImports.length > 0) {
        return `import { ${keptImports.join(', ')} } from '${modulePath}';\n${newImportLine}`;
      }
      return newImportLine;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
