import os
import glob
import re

mapping = {
    'infra/observability/__mocks__/logger.mock': 'shared/contracts/__mocks__/logger.contract.mock',
    'infra/observability/__mocks__/reporter.mock': 'shared/contracts/__mocks__/reporter.contract.mock',
    'infra/persistence/repos/ledger/queries/__mocks__/account-transaction.query.repo.impl.mock': 'app/ledger/contracts/__mocks__/account-transaction.query.repo.contract.mock',
    'infra/persistence/repos/user/__mocks__/user-session.repo.impl.mock': 'app/auth/contracts/__mocks__/user-session.repo.contract.mock',
    'infra/persistence/repos/user/__mocks__/user-auth.repo.impl.mock': 'app/auth/contracts/__mocks__/user-auth.repo.contract.mock',
    'infra/persistence/cache/__mocks__/cache-storage.impl.mock': 'shared/contracts/__mocks__/cache-storage.contract.mock',
    'infra/messaging/__mock__/event-bus.mock': 'shared/contracts/__mocks__/event-bus.contract.mock',
    'infra/messaging/queues/__mocks__/ledger-account-balance.queue.mock': 'app/ledger/contracts/__mocks__/ledger-balance-adjustment-queue.contract.mock',
    'infra/services/__mocks__/repo.service.mock': 'shared/contracts/__mocks__/repo.contract.mock',
    'infra/services/__mocks__/fx-lot-cost-basis.service.mock': 'app/subledger/fx-cost-basis/contracts/__mocks__/fx-cost-basis-persistence.service.contract.mock',
    'infra/services/__mocks__/auth.service.mock': 'app/auth/contracts/__mocks__/auth-service.contract.mock',
    'infra/services/__mocks__/transactional-email.service.mock': 'app/notification/contracts/__mocks__/transactional-email-service.contract.mock',
    'infra/services/__mocks__/exchange-rate.service.mock': 'app/currency/contracts/__mocks__/exchange-rate.service.contract.mock',
    'infra/services/__mocks__/request-context.mock': 'app/shared/contracts/__mocks__/request-context.contract.mock'
}

bookkeeping_mocks = {
    'transactionEntry': ('mockTransactionEntryService', 'app/bookkeeping/contracts/__mocks__/transaction-entry.service.contract.mock'),
    'openingBalanceEntry': ('mockOpeningBalanceEntryService', 'app/bookkeeping/contracts/__mocks__/opening-balance-entry.service.contract.mock'),
    'balancePropagation': ('mockLedgerAccountBalancePropagationService', 'app/bookkeeping/contracts/__mocks__/ledger-account-balance-adjustment-service.contract.mock'),
    'journalEntryPersistence': ('mockJournalEntryPersistenceService', 'app/bookkeeping/contracts/__mocks__/journal-entry-persistence.service.contract.mock')
}

ts_files = glob.glob('src/**/*.ts', recursive=True)

for ts_file in ts_files:
    with open(ts_file, 'r') as f:
        content = f.read()
    
    original_content = content
    file_dir = os.path.dirname(os.path.abspath(ts_file))
    src_dir = os.path.abspath('src')

    for old, new in mapping.items():
        # find imports ending with `old` (with or without quotes, but usually relative paths)
        # We look for the basename: old.split('/')[-1]
        old_base = old.split('/')[-1]
        if old_base in content:
            new_abs = os.path.join(src_dir, new)
            rel_path = os.path.relpath(new_abs, file_dir)
            if not rel_path.startswith('.'):
                rel_path = './' + rel_path
                
            # Replace the import path
            # Regex to match `from '.../old'` or `from ".../old"`
            pattern = r"['\"](\.?\.?.*?/" + re.escape(old_base) + r")['\"]"
            content = re.sub(pattern, f"'{rel_path}'", content)

    # Handle bookkeeping
    if 'mockBookkeepingServices' in content:
        # We need to inject the 4 imports and remove the old import
        # Remove old import
        pattern = r"import\s+mockBookkeepingServices\s+from\s+['\"].*?bookkeeping\.service\.mock['\"];?"
        content = re.sub(pattern, '', content)

        # Prepend the new imports
        imports_to_add = []
        for prop, (mock_name, new_path) in bookkeeping_mocks.items():
            if f'mockBookkeepingServices.{prop}' in content:
                new_abs = os.path.join(src_dir, new_path)
                rel_path = os.path.relpath(new_abs, file_dir)
                if not rel_path.startswith('.'):
                    rel_path = './' + rel_path
                imports_to_add.append(f"import {mock_name} from '{rel_path}';")
                
                # Replace usage
                content = content.replace(f'mockBookkeepingServices.{prop}', mock_name)
        
        if imports_to_add:
            content = "\n".join(imports_to_add) + "\n" + content

    if content != original_content:
        with open(ts_file, 'w') as f:
            f.write(content)

print("Import paths updated.")
