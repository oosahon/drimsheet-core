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
      if (file.endsWith('index.ts')) return;
      results.push(file);
    }
  });
  return results;
}

const files = findErrorFiles(path.join(process.cwd(), 'src/domain'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  const domain = path.dirname(file).split('/').slice(-2)[0];
  let basename = path
    .basename(file)
    .replace(/\.errors?\.ts$/, '')
    .replace(/-/g, '_');

  // Custom logic to match standard conventions
  // Wait, some basenames had a specific prefix. Like `accounting-standard` -> `accounting_error_standard_`? Let's just keep the domain and basename.
  if (basename === 'accounting_standard') basename = 'standard'; // if needed

  let intendedPrefix = `${domain}_error_${basename}_`;

  // Wait, let's look at the actual values in EErrorKeys!
  const keysMatch = content.match(/: '([^']+)'/g);
  if (keysMatch) {
    let prefixes = keysMatch.map((k) => k.match(/: '([^']+)'/)[1]);

    // The prefix should just be everything up to the LAST underscore before the dynamic part.
    // E.g. 'accounting_error_accounting_entity_unauthorized' -> 'accounting_error_accounting_entity_'
    // If there are multiple keys, finding the common prefix up to the last '_' is easy.
    if (prefixes.length > 1) {
      let common = prefixes[0];
      for (let p of prefixes) {
        while (!p.startsWith(common)) {
          common = common.slice(0, -1);
        }
      }
      // ensure it ends with _
      if (!common.endsWith('_')) {
        common = common.substring(0, common.lastIndexOf('_') + 1);
      }
      intendedPrefix = common;
    } else if (prefixes.length === 1) {
      // If only 1 key, e.g. `accounting_error_accounting_entity_unauthorized`
      // Assume the intended prefix is exactly what we guessed: domain + basename
      // Or just use the guessed intendedPrefix and see if the single key starts with it!
      const guessedPrefix = `${domain.replace(/-/g, '_')}_error_${basename}_`;
      if (prefixes[0].startsWith(guessedPrefix)) {
        intendedPrefix = guessedPrefix;
      } else {
        // Let's just try to remove the key name from the end.
        // Key name is 'Unauthorized', so snake case is 'unauthorized'.
        // Or 'InvalidCode' -> 'invalid_code'
        const keyNameMatch = content.match(/([A-Za-z0-9_]+): '[^']+'/);
        if (keyNameMatch) {
          const keyName = keyNameMatch[1];
          const snakeKey = keyName
            .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
            .replace(/^_/, '');
          if (prefixes[0].endsWith(snakeKey)) {
            intendedPrefix = prefixes[0].slice(0, -snakeKey.length);
          }
        }
      }
    }
  }

  // Replace type TErrorKeyPrefix = `...${string}`; with the intended prefix
  content = content.replace(
    /type\s+TErrorKeyPrefix\s*=\s*`[^`]+`;/,
    `type TErrorKeyPrefix = \`${intendedPrefix}\${string}\`;`
  );

  fs.writeFileSync(file, content);
  console.log(`Fixed prefix in ${path.basename(file)} to ${intendedPrefix}`);
}
