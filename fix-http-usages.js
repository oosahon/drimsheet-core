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

files.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Replace `new httpError.BadRequest('string')` with `new httpError.BadRequest()`
  // Replace `new httpError.BadRequest('string', cause)` with `new httpError.BadRequest(cause)`

  const regex1 =
    /new httpError\.([A-Za-z]+)\(\s*['"][^'"]+['"]\s*,\s*([^)]+)\)/g;
  if (regex1.test(content)) {
    content = content.replace(regex1, 'new httpError.$1($2)');
    changed = true;
  }

  const regex2 = /new httpError\.([A-Za-z]+)\(\s*['"][^'"]+['"]\s*\)/g;
  if (regex2.test(content)) {
    content = content.replace(regex2, 'new httpError.$1()');
    changed = true;
  }

  // Handle UnprocessableEntity with message: `new httpError.UnprocessableEntity(validationErrors, 'string')`
  const regex3 =
    /new httpError\.UnprocessableEntity\(\s*([^,]+)\s*,\s*['"][^'"]+['"]\s*\)/g;
  if (regex3.test(content)) {
    content = content.replace(regex3, 'new httpError.UnprocessableEntity($1)');
    changed = true;
  }

  const regex4 =
    /new httpError\.UnprocessableEntity\(\s*([^,]+)\s*,\s*['"][^'"]+['"]\s*,\s*([^)]+)\)/g;
  if (regex4.test(content)) {
    content = content.replace(
      regex4,
      'new httpError.UnprocessableEntity($1, $2)'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
