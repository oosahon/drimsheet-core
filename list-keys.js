const fs = require('fs');
const path = require('path');

function findErrorFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findErrorFiles(file));
    } else if (file.endsWith('.errors.ts') || file.endsWith('.error.ts')) {
      if (file.endsWith('index.ts')) return; // skip index
      results.push(file);
    }
  });
  return results;
}

const files = findErrorFiles(path.join(process.cwd(), 'src/domain'));
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(/const EErrorKeys = \{([\s\S]*?)\}\s*as\s*const/);
  if (match) {
    console.log(`\n--- ${path.basename(file)} ---`);
    console.log(match[1].trim());
  }
}
