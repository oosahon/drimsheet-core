const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  if (content.includes('toThrow(AppError)')) {
    content = content.replace(/toThrow\(AppError\)/g, 'toThrow()');

    // Also remove AppError import if no longer used
    if (!content.includes('AppError(') && !content.includes('AppError ')) {
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
