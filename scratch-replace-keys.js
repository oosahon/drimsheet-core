const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function refactorFile(file) {
  if (!file.endsWith('.ts')) return;
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/http_error_unprocessable_entity/g, 'app_error_unprocessable')
    .replace(/http_error_/g, 'app_error_');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
}

walkDir('src/app/usecases', refactorFile);
refactorFile(
  'src/interface/http/helpers/__tests__/get-accounting-entity-from-request.helper.test.ts'
);
console.log('Done mapping keys');
