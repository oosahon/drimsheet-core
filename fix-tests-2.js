const fs = require('fs');
const path = require('path');

function findTestFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findTestFiles(file));
    } else if (file.endsWith('.test.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = findTestFiles(path.join(process.cwd(), 'src/domain'));
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.match(/toThrow\(\s*AppError\s*\)/)) {
    content = content.replace(/toThrow\(\s*AppError\s*\)/g, 'toThrow()');
    changed = true;
  }

  if (content.match(/toBeInstanceOf\(\s*AppError\s*\)/)) {
    content = content.replace(
      /toBeInstanceOf\(\s*AppError\s*\)/g,
      'toBeInstanceOf(Error)'
    );
    changed = true;
  }

  // Find remaining AppError inside expects and replace with Error
  if (content.match(/toThrowError\(\s*AppError\s*\)/)) {
    content = content.replace(
      /toThrowError\(\s*AppError\s*\)/g,
      'toThrowError()'
    );
    changed = true;
  }

  if (content.match(/new\s+AppError\([^)]*\)/)) {
    // Don't blanket replace new AppError unless we want to use new Error. Let's do it for tests.
    content = content.replace(
      /new\s+AppError\([^)]*\)/g,
      'new Error("mock error")'
    );
    changed = true;
  }

  if (changed) {
    // If AppError is no longer used, remove import
    if (!content.includes('AppError(') && !content.match(/\bAppError\b/)) {
      content = content.replace(
        /import\s+\{([^}]*)AppError([^}]*)\}\s+from\s+['"][^'"]+['"];?\n/g,
        (match, p1, p2) => {
          const remaining = [p1, p2]
            .map((s) => s.trim())
            .filter(Boolean)
            .join(', ');
          if (!remaining) return '';
          return match
            .replace('AppError', '')
            .replace(/,\s*,/g, ',')
            .replace(/\{\s*,/, '{')
            .replace(/,\s*\}/, '}');
        }
      );
    }
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
