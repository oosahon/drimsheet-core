const fs = require('fs');
const path = require('path');

const files = [
  'src/app/usecases/user/__specs__/get-profile.usecase.spec.ts',
  'src/app/usecases/user/__specs__/get-preferences.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/refresh-access-token.usecase.spec.ts',
];

files.forEach((f) => {
  const fPath = path.join(__dirname, f);
  if (!fs.existsSync(fPath)) return;
  let c = fs.readFileSync(fPath, 'utf-8');
  let changed = false;

  const oldLen = c.length;
  c = c.replace(
    /toThrow\(\s*httpError\.Unauthorized\s*\)/g,
    "toThrow('app_error_http_unauthorized')"
  );

  if (c.length !== oldLen) {
    fs.writeFileSync(fPath, c, 'utf-8');
    console.log(`Updated ${f}`);
  }
});

let oauthTest = path.join(
  __dirname,
  'src/app/usecases/auth/helpers/__tests__/oauth-handler-google.helper.test.ts'
);
if (fs.existsSync(oauthTest)) {
  let c = fs.readFileSync(oauthTest, 'utf-8');
  c = c.replace(
    /message: 'Bad Request'/g,
    "message: 'app_error_http_bad_request'"
  );
  c = c.replace(
    /message: 'Internal Server Error'/g,
    "message: 'app_error_http_internal_server_error'"
  );
  fs.writeFileSync(oauthTest, c, 'utf-8');
  console.log(`Updated oauth test`);
}
