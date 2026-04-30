const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const replacements = {
  // bookkeeping
  CannotSetOpeningBalanceOnControlAccount:
    'ControlAccountOpeningBalanceNotAllowed',
  OpeningBalanceAlreadySet: 'ExistingOpeningBalance',
  OpeningBalanceAccountNotConfigured: 'UnconfiguredOpeningBalanceAccount',
  JournalLinesEmpty: 'EmptyJournalLines',

  // exchange-rate
  CannotAlterOfficial: 'UpdateNotPermitted',

  // period
  EndDateIsInThePast: 'PastEndDate',

  // journal-entry
  DebitsMustEqualCredits: 'UnbalancedJournalEntry',
  SequenceOrdersMustBeUnique: 'DuplicateSequenceOrders',

  // journal-line
  ExchangeRateNotSupported: 'UnsupportedExchangeRate',
  ExchangeRateRequired: 'MissingExchangeRate',
  ExchangeRateBaseMismatch: 'MismatchedExchangeRateBase',
  ExchangeRateTargetMismatch: 'MismatchedExchangeRateTarget',

  // transaction
  CounterpartyIdRequired: 'MissingCounterpartyId',
  MinimumItemsRequired: 'InsufficientTransactionItems',

  // ledger-account
  LimitReached: 'MaximumLimitReached',
};

function toSnakeCase(str) {
  return str
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/^_/, '');
}

function findTsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findTsFiles(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = findTsFiles(path.join(process.cwd(), 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const [oldKey, newKey] of Object.entries(replacements)) {
    const oldSnake = toSnakeCase(oldKey);
    const newSnake = toSnakeCase(newKey);

    // Replace the exact key usages like `errorObj.OldKey`
    const keyRegex = new RegExp(`\\b${oldKey}\\b`, 'g');
    if (keyRegex.test(content)) {
      content = content.replace(keyRegex, newKey);
      changed = true;
    }

    // Replace the snake_case strings in EErrorKeys definitions
    // e.g. 'bookkeeping_error_bookkeeping_journal_lines_empty'
    const snakeRegex = new RegExp(`_${oldSnake}'`, 'g');
    if (snakeRegex.test(content)) {
      content = content.replace(snakeRegex, `_${newSnake}'`);
      changed = true;
    }

    // Sometimes the snake case string might be exactly the old string without leading underscore if it was the full string
    // This is safer to just replace inside quotes if it matches `oldSnake`
    const pureSnakeRegex = new RegExp(`'([^']+)_${oldSnake}'`, 'g');
    if (pureSnakeRegex.test(content)) {
      // already caught by previous
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
