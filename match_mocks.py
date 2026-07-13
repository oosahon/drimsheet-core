import os
import glob
import re

contract_files = glob.glob('src/**/*.contract.ts', recursive=True)
mock_files = glob.glob('src/**/*.mock.ts', recursive=True)

contract_map = {}
for c in contract_files:
    basename = os.path.basename(c).replace('.contract.ts', '')
    contract_map[basename] = c

for m in mock_files:
    with open(m, 'r') as f:
        content = f.read()
    
    # find imports ending with .contract
    imports = re.findall(r"from\s+['\"](.*\.contract)['\"]", content)
    for imp in imports:
        basename = os.path.basename(imp).replace('.contract', '')
        if basename in contract_map:
            print(f"Mock {m} mocks contract {contract_map[basename]}")

