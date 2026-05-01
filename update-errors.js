const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.error.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // We will use a regex to find class declarations and their constructors
    // Regex matches: class ClassName ... { ... constructor(...) { ... super(...);
    // and we insert this.name = 'ClassName'; if it's not there.

    const classRegex =
      /class\s+([A-Za-z0-9_]+)(?:[\s\S]*?)constructor\s*\([^)]*\)\s*\{([\s\S]*?)\}/g;

    const newContent = content.replace(
      classRegex,
      (match, className, constructorBody) => {
        // Check if this.name is already set in the constructor body
        if (constructorBody.includes('this.name =')) {
          return match;
        }

        // Find the super(...) call to insert this.name after it
        const superRegex = /(super\([^)]*\);?)/;
        if (superRegex.test(constructorBody)) {
          modified = true;
          const newBody = constructorBody.replace(
            superRegex,
            `$1\n    this.name = '${className}';`
          );
          return match.replace(constructorBody, newBody);
        } else {
          // If no super(), just insert at the beginning of the constructor
          modified = true;
          return match.replace('{', `{\n    this.name = '${className}';`);
        }
      }
    );

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated', filePath);
      count++;
    }
  }
});

console.log(`Updated ${count} files.`);
