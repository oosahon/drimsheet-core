import { ILedgerAccount } from '@domain/ledger/types/ledger.types';

/** Returns each account path and all of its ancestor paths without duplicates. */
export default function getRequiredLedgerAccountMaterializedPaths(
  accounts: Pick<ILedgerAccount, 'materializedPath'>[]
) {
  const accountPaths = accounts.flatMap((account) => {
    const segments = account.materializedPath.split('.');

    return segments.map((_, index) => segments.slice(0, index + 1).join('.'));
  });

  return [...new Set(accountPaths)];
}
