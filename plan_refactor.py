import os
import glob
import re

contract_files = glob.glob('src/**/*.contract.ts', recursive=True)
mock_files = glob.glob('src/**/*.mock.ts', recursive=True)

contract_map = {}
for c in contract_files:
    basename = os.path.basename(c).replace('.contract.ts', '')
    contract_map[basename] = c

mock_to_contracts = {}
for m in mock_files:
    with open(m, 'r') as f:
        content = f.read()
    
    imports = re.findall(r"from\s+['\"](.*\.contract)['\"]", content)
    for imp in imports:
        basename = os.path.basename(imp).replace('.contract', '')
        if basename in contract_map:
            if m not in mock_to_contracts:
                mock_to_contracts[m] = []
            mock_to_contracts[m].append(contract_map[basename])

print("Files to split/move:")
for m, contracts in mock_to_contracts.items():
    print(f"\n{m} -> ")
    for c in contracts:
        c_dir = os.path.dirname(c)
        c_base = os.path.basename(c).replace('.ts', '')
        new_mock_path = os.path.join(c_dir, '__mocks__', c_base + '.mock.ts')
        print(f"   {new_mock_path}")

