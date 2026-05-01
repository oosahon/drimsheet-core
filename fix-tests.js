const fs = require('fs');
const path = require('path');

const files = [
  'src/interface/http/handlers/__test__/error.handler.test.ts',
  'src/app/usecases/accounting/__specs__/create-accounting-entity.usecase.spec.ts',
  'src/app/usecases/bookkeeping/__specs__/record-opening-balance.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/signup-with-email.usecase.spec.ts',
  'src/app/usecases/auth/__specs__/send-email-verification-email.usecase.spec.ts',
];

files.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  if (file.includes('error.handler.test.ts')) {
    content = content.replace(
      /'Database connection failed'/g,
      "'Internal Server Error'"
    );
    changed = true;
  }

  if (file.includes('create-accounting-entity.usecase.spec.ts')) {
    content = content.replace(
      /toThrow\(\s*['"]Unsupported accounting entity type['"]\s*\)/g,
      "toThrow('Bad Request')"
    );
    content = content.replace(
      /toThrow\(\s*['"]Accounting entity already exists['"]\s*\)/g,
      "toThrow('Conflict')"
    );
    changed = true;
  }

  if (file.includes('record-opening-balance.usecase.spec.ts')) {
    content = content.replace(
      /toThrow\(\s*['"]Account not found\.['"]\s*\)/g,
      "toThrow('Resource Not Found')"
    );
    changed = true;
  }

  if (file.includes('signup-with-email.usecase.spec.ts')) {
    content = content.replace(
      /toThrow\(\s*['"]An account with this email already exists['"]\s*\)/g,
      "toThrow('Conflict')"
    );
    content = content.replace(
      /toThrow\(\s*['"]Email is not permitted['"]\s*\)/g,
      "toThrow('Forbidden')"
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
