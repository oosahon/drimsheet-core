const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const httpErrorsPath = path.join(srcDir, 'app/errors/http.errors.ts');

function getRelativePath(fromFile, toFile) {
  const rel = path.relative(path.dirname(fromFile), toFile);
  let result = rel.replace(/\.ts$/, '');
  if (!result.startsWith('.')) {
    result = './' + result;
  }
  return result;
}

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
  'src/shared/utils/zod-validation-runner.ts',
  'src/app/errors/http.errors.ts',
];

files.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  if (content.includes('@/app/errors/http.errors')) {
    const relHttpError = getRelativePath(filePath, httpErrorsPath);
    content = content.replace(/@\/app\/errors\/http\.errors/g, relHttpError);
    changed = true;
  }

  if (content.includes('@/shared/utils/error')) {
    const errorPath = path.join(srcDir, 'shared/utils/error.ts');
    const relError = getRelativePath(filePath, errorPath);
    content = content.replace(/@\/shared\/utils\/error/g, relError);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
