import os
import glob
import re

mock_files = [
    'src/infra/observability/__mocks__/logger.mock.ts',
    'src/infra/observability/__mocks__/reporter.mock.ts',
    'src/infra/persistence/repos/ledger/queries/__mocks__/account-transaction.query.repo.impl.mock.ts',
    'src/infra/persistence/repos/user/__mocks__/user-session.repo.impl.mock.ts',
    'src/infra/persistence/repos/user/__mocks__/user-auth.repo.impl.mock.ts',
    'src/infra/persistence/cache/__mocks__/cache-storage.impl.mock.ts',
    'src/infra/messaging/__mock__/event-bus.mock.ts',
    'src/infra/messaging/queues/__mocks__/ledger-account-balance.queue.mock.ts',
    'src/infra/services/__mocks__/repo.service.mock.ts',
    'src/infra/services/__mocks__/fx-lot-cost-basis.service.mock.ts',
    'src/infra/services/__mocks__/auth.service.mock.ts',
    'src/infra/services/__mocks__/transactional-email.service.mock.ts',
    'src/infra/services/__mocks__/exchange-rate.service.mock.ts',
    'src/infra/services/__mocks__/request-context.mock.ts',
    'src/infra/services/__mocks__/bookkeeping.service.mock.ts'
]

ts_files = glob.glob('src/**/*.ts', recursive=True) + glob.glob('test/**/*.ts', recursive=True)

for m in mock_files:
    # m = src/infra/services/__mocks__/bookkeeping.service.mock.ts
    # basename = bookkeeping.service.mock
    basename = os.path.basename(m).replace('.ts', '')
    
    # We want to find imports containing this basename or something similar
    # It's better to just search for the basename
    for t in ts_files:
        if t == m: continue
        with open(t, 'r') as f:
            content = f.read()
        if basename in content:
            print(f"{t} imports {basename}")

