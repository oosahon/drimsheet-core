const fs = require('fs');
const path = require('path');

const iocDir = path.join(__dirname, 'src/infra/ioc');

const dirs = fs
  .readdirSync(iocDir)
  .filter((f) => fs.statSync(path.join(iocDir, f)).isDirectory());

const typeMapping = {
  'services.ts': 'services',
  'helpers.ts': 'helpers',
  'usecases.ts': 'usecases',
  'workers.ts': 'workers',
  'handlers.ts': 'handlers',
};

// Create new directories
Object.values(typeMapping).forEach((dir) => {
  const p = path.join(iocDir, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

dirs.forEach((namespace) => {
  if (namespace === '_bootstrap') return; // Skip bootstrap

  const nsPath = path.join(iocDir, namespace);
  const files = fs.readdirSync(nsPath);

  files.forEach((file) => {
    if (typeMapping[file]) {
      const targetDir = path.join(iocDir, typeMapping[file]);
      let namespaceName = namespace;
      if (namespaceName === '_internal') namespaceName = 'internal'; // optional, but internal.usecases.ts is better than _internal.usecases.ts

      const newFileName = `${namespaceName}.${file}`;
      const targetPath = path.join(targetDir, newFileName);

      fs.renameSync(path.join(nsPath, file), targetPath);
    }
  });

  // Try to remove old dir if empty
  if (fs.readdirSync(nsPath).length === 0) {
    fs.rmdirSync(nsPath);
  }
});
