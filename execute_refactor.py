import os
import shutil

moves = [
    ('src/infra/observability/__mocks__/logger.mock.ts', 'src/shared/contracts/__mocks__/logger.contract.mock.ts'),
    ('src/infra/observability/__mocks__/reporter.mock.ts', 'src/shared/contracts/__mocks__/reporter.contract.mock.ts'),
    ('src/infra/persistence/repos/ledger/queries/__mocks__/account-transaction.query.repo.impl.mock.ts', 'src/app/ledger/contracts/__mocks__/account-transaction.query.repo.contract.mock.ts'),
    ('src/infra/persistence/repos/user/__mocks__/user-session.repo.impl.mock.ts', 'src/app/auth/contracts/__mocks__/user-session.repo.contract.mock.ts'),
    ('src/infra/persistence/repos/user/__mocks__/user-auth.repo.impl.mock.ts', 'src/app/auth/contracts/__mocks__/user-auth.repo.contract.mock.ts'),
    ('src/infra/persistence/cache/__mocks__/cache-storage.impl.mock.ts', 'src/shared/contracts/__mocks__/cache-storage.contract.mock.ts'),
    ('src/infra/messaging/__mock__/event-bus.mock.ts', 'src/shared/contracts/__mocks__/event-bus.contract.mock.ts'),
    ('src/infra/messaging/queues/__mocks__/ledger-account-balance.queue.mock.ts', 'src/app/ledger/contracts/__mocks__/ledger-balance-adjustment-queue.contract.mock.ts'),
    ('src/infra/services/__mocks__/repo.service.mock.ts', 'src/shared/contracts/__mocks__/repo.contract.mock.ts'),
    ('src/infra/services/__mocks__/fx-lot-cost-basis.service.mock.ts', 'src/app/subledger/fx-cost-basis/contracts/__mocks__/fx-cost-basis-persistence.service.contract.mock.ts'),
    ('src/infra/services/__mocks__/auth.service.mock.ts', 'src/app/auth/contracts/__mocks__/auth-service.contract.mock.ts'),
    ('src/infra/services/__mocks__/transactional-email.service.mock.ts', 'src/app/notification/contracts/__mocks__/transactional-email-service.contract.mock.ts'),
    ('src/infra/services/__mocks__/exchange-rate.service.mock.ts', 'src/app/currency/contracts/__mocks__/exchange-rate.service.contract.mock.ts'),
    ('src/infra/services/__mocks__/request-context.mock.ts', 'src/app/shared/contracts/__mocks__/request-context.contract.mock.ts')
]

for src, dst in moves:
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        # Fix imports before moving
        with open(src, 'r') as f:
            content = f.read()
            # If the import has `../../..`, it's probably wrong now. Let's just fix it later. 
            # Actually, since it's now collocated, the import to the contract is just `../<contract_name>`.
            # We'll use a regex to replace `import .* from '.*contract';` to `import .* from '../<contract_name>';`
            import re
            def replacer(match):
                imp = match.group(0)
                # Find the contract name
                contract_name = re.search(r"['\"](.*?)['\"]", imp).group(1).split('/')[-1]
                return re.sub(r"from\s+['\"].*?['\"]", f"from '../{contract_name}'", imp)
            content = re.sub(r"import\s+.*?\s+from\s+['\"].*?\.contract['\"];", replacer, content)
        
        with open(dst, 'w') as f:
            f.write(content)
        os.remove(src)

# Now handle the bookkeeping split
bookkeeping_mock = 'src/infra/services/__mocks__/bookkeeping.service.mock.ts'
if os.path.exists(bookkeeping_mock):
    os.makedirs('src/app/bookkeeping/contracts/__mocks__', exist_ok=True)
    
    splits = [
        {
            'path': 'src/app/bookkeeping/contracts/__mocks__/transaction-entry.service.contract.mock.ts',
            'content': """import ITransactionEntryService from '../transaction-entry.service.contract';

const mockTransactionEntryService: jest.Mocked<ITransactionEntryService> = {
  create: jest.fn(),
};

export default mockTransactionEntryService;
"""
        },
        {
            'path': 'src/app/bookkeeping/contracts/__mocks__/opening-balance-entry.service.contract.mock.ts',
            'content': """import IOpeningBalanceEntryService from '../opening-balance-entry.service.contract';

const mockOpeningBalanceEntryService: jest.Mocked<IOpeningBalanceEntryService> = {
  create: jest.fn(),
};

export default mockOpeningBalanceEntryService;
"""
        },
        {
            'path': 'src/app/bookkeeping/contracts/__mocks__/ledger-account-balance-adjustment-service.contract.mock.ts',
            'content': """import { ILedgerAccountBalancePropagationService } from '../ledger-account-balance-adjustment-service.contract';

const mockLedgerAccountBalancePropagationService: jest.Mocked<ILedgerAccountBalancePropagationService> = {
  propagate: jest.fn(),
};

export default mockLedgerAccountBalancePropagationService;
"""
        },
        {
            'path': 'src/app/bookkeeping/contracts/__mocks__/journal-entry-persistence.service.contract.mock.ts',
            'content': """import IJournalEntryPersistenceService from '../journal-entry-persistence.service.contract';

const mockJournalEntryPersistenceService: jest.Mocked<IJournalEntryPersistenceService> = {
  create: jest.fn(),
};

export default mockJournalEntryPersistenceService;
"""
        }
    ]
    
    for split in splits:
        with open(split['path'], 'w') as f:
            f.write(split['content'])
            
    os.remove(bookkeeping_mock)

print("Files moved and split successfully.")
