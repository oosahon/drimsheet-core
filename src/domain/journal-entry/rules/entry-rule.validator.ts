import { ULedgerAccountBehavior } from '../../ledger/shared/types/account-behaviors.tyypes';
import { ULedgerAccountSubType } from '../../ledger/shared/types/ledger-aggregate.types';
import { ILedgerAccount } from '../../ledger/shared/types/ledger.types';
import { IJournalEntryRulePermits } from '../types/entry.rules.types';

export default function journalEntryRuleValidator(
  account: ILedgerAccount,
  permits: IJournalEntryRulePermits
) {
  const isWrongType =
    permits.permittedTypes !== '*' && !permits.permittedTypes.has(account.type);

  if (isWrongType) return false;

  const isWrongSubType =
    permits.permittedSubTypes !== '*' &&
    !permits.permittedSubTypes.has(account.subType as ULedgerAccountSubType);

  if (isWrongSubType) {
    return false;
  }

  const isWrongBehavior =
    permits.permittedBehaviors !== '*' &&
    !permits.permittedBehaviors.has(account.behavior as ULedgerAccountBehavior);

  if (isWrongBehavior) {
    return false;
  }

  return true;
}
