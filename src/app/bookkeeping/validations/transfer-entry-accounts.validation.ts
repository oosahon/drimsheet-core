import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
import { ELedgerAccountSubType } from '../../../domain/ledger/types/ledger-aggregate.types';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';

export default function validateTransferEntryAccounts(
  source: ILedgerAccount,
  destinations: ILedgerAccount[]
) {
  const allowedTransferSubTypes: string[] = [
    ELedgerAccountSubType.CashAndCashEquivalent,
  ];

  if (!allowedTransferSubTypes.includes(source.subType)) {
    throw new journalEntryError.TransferNotPermittedOnAccount({
      cause: { accountId: source.id, subType: source.subType },
    });
  }

  const differentSubTypes = destinations
    .filter((account) => account.subType !== source.subType)
    .map((account) => ({ id: account.id, subType: account.subType }));

  if (differentSubTypes.length > 0) {
    throw new journalEntryError.TransferNotPermittedOnAccount({
      cause: differentSubTypes,
    });
  }
}
