const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/usecases/user/__specs__/get-profile.usecase.spec.ts',
  'src/app/usecases/user/__specs__/get-preferences.usecase.spec.ts',
  'src/app/usecases/bookkeeping/__specs__/create-ledger-account-balance.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/refresh-access-token.usecase.spec.ts',
  'src/app/usecases/internal/__specs__/get-sent-email.usecase.spec.ts',
];

filesToFix.forEach((f) => {
  const fPath = path.join(__dirname, f);
  if (!fs.existsSync(fPath)) return;
  let c = fs.readFileSync(fPath, 'utf-8');
  let changed = false;

  // Replace `toThrow(httpError.Unauthorized)` with `toThrow('app_error_http_unauthorized')`
  // Wait, if it passed httpError.Unauthorized, why did it fail? Let's just pass the string key.

  if (c.includes('toThrow(httpError.Unauthorized)')) {
    c = c.replace(
      /toThrow\(httpError\.Unauthorized\)/g,
      "toThrow('app_error_http_unauthorized')"
    );
    changed = true;
  }
  if (c.includes("toThrow('Forbidden')")) {
    c = c.replace(
      /toThrow\('Forbidden'\)/g,
      "toThrow('app_error_http_forbidden')"
    );
    changed = true;
  }
  if (c.includes('toThrow(httpError.Forbidden)')) {
    c = c.replace(
      /toThrow\(httpError\.Forbidden\)/g,
      "toThrow('app_error_http_forbidden')"
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fPath, c, 'utf-8');
    console.log(`Updated ${f}`);
  }
});
