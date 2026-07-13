const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function fixFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  replacements.forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  });
  if (changed) fs.writeFileSync(file, content, 'utf8');
}

fixFile(
  path.join(srcDir, 'infra/messaging/external/exchange-rate.consumer.ts'),
  [
    [
      '../../ioc/currency.workers/workers.currency.workers',
      '../../ioc/workers/currency.workers',
    ],
  ]
);

fixFile(path.join(srcDir, 'infra/messaging/workers/index.ts'), [
  [
    '../../ioc/ledger.workers/workers.ledger.workers',
    '../../ioc/workers/ledger.workers',
  ],
  [
    '../../ioc/notification.workers/workers.notification.workers',
    '../../ioc/workers/notification.workers',
  ],
]);
