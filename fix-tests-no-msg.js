const fs = require('fs');
const path = require('path');

let f1 = path.join(
  __dirname,
  'src/interface/http/handlers/__test__/error.handler.test.ts'
);
if (fs.existsSync(f1)) {
  let c = fs.readFileSync(f1, 'utf-8');
  c = c.replace(
    /message: 'Bad Request',/g,
    "message: 'app_error_http_bad_request',"
  );
  c = c.replace(
    /message: 'Internal Server Error',/g,
    "message: 'app_error_http_internal_server_error',"
  );
  fs.writeFileSync(f1, c, 'utf-8');
}

let f2 = path.join(__dirname, 'src/app/errors/__tests__/http.errors.test.ts');
if (fs.existsSync(f2)) {
  let c = fs.readFileSync(f2, 'utf-8');
  c = c.replace(/toBe\('Bad Request'\)/g, "toBe('app_error_http_bad_request')");
  c = c.replace(
    /toBe\('Unauthorized'\)/g,
    "toBe('app_error_http_unauthorized')"
  );
  c = c.replace(
    /toBe\('Payment Required'\)/g,
    "toBe('app_error_http_payment_required')"
  );
  c = c.replace(/toBe\('Forbidden'\)/g, "toBe('app_error_http_forbidden')");
  c = c.replace(
    /toBe\('Resource Not Found'\)/g,
    "toBe('app_error_http_resource_not_found')"
  );
  c = c.replace(/toBe\('Conflict'\)/g, "toBe('app_error_http_conflict')");
  c = c.replace(
    /toBe\('Unprocessable Entity'\)/g,
    "toBe('app_error_http_unprocessable_entity')"
  );
  c = c.replace(
    /toBe\('Too Many Requests'\)/g,
    "toBe('app_error_http_too_many_requests')"
  );
  c = c.replace(
    /toBe\('Internal Server Error'\)/g,
    "toBe('app_error_http_internal_server_error')"
  );
  fs.writeFileSync(f2, c, 'utf-8');
}

console.log('Fixed tests for no-message mode.');
