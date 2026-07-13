const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Pattern 1: ../../../infra/ioc/<namespace>/<type>
  content = content.replace(
    /(\.\.\/\.\.\/\.\.\/infra\/ioc)\/([^/]+)\/([^"']+)/g,
    (match, base, ns, type) => {
      changed = true;
      if (ns === '_internal') ns = 'internal';
      return `${base}/${type}/${ns}.${type}`;
    }
  );

  // Pattern 2: ../../ioc/<namespace>/<type>
  content = content.replace(
    /(\.\.\/\.\.\/ioc)\/([^/]+)\/([^"']+)/g,
    (match, base, ns, type) => {
      changed = true;
      if (ns === '_internal') ns = 'internal';
      return `${base}/${type}/${ns}.${type}`;
    }
  );

  // Pattern 3: ../ioc/<namespace>/<type>
  content = content.replace(
    /(\.\.\/ioc)\/([^/]+)\/([^"']+)/g,
    (match, base, ns, type) => {
      changed = true;
      if (ns === '_internal') ns = 'internal';
      return `${base}/${type}/${ns}.${type}`;
    }
  );

  // Pattern 4: src/infra/ioc/_bootstrap/events.bootstrap.ts
  if (file.endsWith('events.bootstrap.ts')) {
    const orig = content;
    content = content.replace(
      /'\.\.\/user\/handlers'/g,
      "'../handlers/user.handlers'"
    );
    if (orig !== content) changed = true;
  }

  // Pattern 5: src/infra/ioc/handlers/user.handlers.ts
  if (file.endsWith('user.handlers.ts')) {
    const orig = content;
    content = content.replace(
      /'\.\.\/auth\/usecases'/g,
      "'../usecases/auth.usecases'"
    );
    if (orig !== content) changed = true;
  }

  // Pattern 6: src/infra/ioc/workers/currency.workers.ts & ledger.workers.ts
  if (file.endsWith('workers.ts')) {
    const orig = content;
    const nsMatch = file.match(/\/([^/]+)\.workers\.ts$/);
    if (nsMatch) {
      const ns = nsMatch[1];
      content = content.replace(
        /'\.\/usecases'/g,
        `'../usecases/${ns}.usecases'`
      );
      content = content.replace(
        /'\.\/services'/g,
        `'../services/${ns}.services'`
      );
    }
    if (orig !== content) changed = true;
  }

  // Also any other relative imports within ioc that might be broken
  // for usecases needing services:
  if (file.includes('/usecases/')) {
    const orig = content;
    const nsMatch = file.match(/\/([^/]+)\.usecases\.ts$/);
    if (nsMatch) {
      const ns = nsMatch[1];
      content = content.replace(
        /'\.\/services'/g,
        `'../services/${ns}.services'`
      );
    }
    if (orig !== content) changed = true;
  }

  if (file.includes('/handlers/')) {
    const orig = content;
    const nsMatch = file.match(/\/([^/]+)\.handlers\.ts$/);
    if (nsMatch) {
      const ns = nsMatch[1];
      content = content.replace(
        /'\.\/usecases'/g,
        `'../usecases/${ns}.usecases'`
      );
    }
    if (orig !== content) changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
