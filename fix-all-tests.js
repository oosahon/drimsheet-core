const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = execSync('grep -rl "toThrow(\'" src/app/usecases')
  .toString()
  .split('\n')
  .filter(Boolean);

const replacements = {
  "toThrow('Bad Request')": "toThrow('app_error_http_bad_request')",
  "toThrow('Unauthorized')": "toThrow('app_error_http_unauthorized')",
  "toThrow('Payment Required')": "toThrow('app_error_http_payment_required')",
  "toThrow('Forbidden')": "toThrow('app_error_http_forbidden')",
  "toThrow('Resource Not Found')":
    "toThrow('app_error_http_resource_not_found')",
  "toThrow('Conflict')": "toThrow('app_error_http_conflict')",
  "toThrow('Unprocessable Entity')":
    "toThrow('app_error_http_unprocessable_entity')",
  "toThrow('Too Many Requests')": "toThrow('app_error_http_too_many_requests')",
  "toThrow('Internal Server Error')":
    "toThrow('app_error_http_internal_server_error')",
};

files.forEach((f) => {
  const fPath = path.resolve(f);
  let c = fs.readFileSync(fPath, 'utf-8');
  let changed = false;

  Object.entries(replacements).forEach(([oldStr, newStr]) => {
    if (c.includes(oldStr)) {
      c = c.replace(
        new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        newStr
      );
      changed = true;
    }
  });

  // Also catch multi-line rejects.toThrow(\n  'Conflict'\n)
  const regexes = {
    Conflict: 'app_error_http_conflict',
    'Resource Not Found': 'app_error_http_resource_not_found',
    Forbidden: 'app_error_http_forbidden',
    Unauthorized: 'app_error_http_unauthorized',
    'Bad Request': 'app_error_http_bad_request',
  };

  Object.entries(regexes).forEach(([word, newWord]) => {
    const rx = new RegExp(`toThrow\\(\\s*'${word}'\\s*\\)`, 'g');
    if (rx.test(c)) {
      c = c.replace(rx, `toThrow('${newWord}')`);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(fPath, c, 'utf-8');
    console.log(`Updated ${f}`);
  }
});
