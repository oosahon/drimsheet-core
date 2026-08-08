import { ULedgerAccountBehavior } from '../../ledger/types/account-behaviors.tyypes';
import { ULedgerAccountSubType } from '../../ledger/types/ledger-aggregate.types';
import { ULedgerType } from '../../ledger/types/ledger.types';

export interface IJournalEntryRulePermits {
  permittedTypes: Set<ULedgerType> | '*';
  permittedSubTypes: Set<ULedgerAccountSubType> | '*';
  permittedBehaviors: Set<ULedgerAccountBehavior> | '*';
}

export interface IJournalEntryRule extends Readonly<{
  source: Readonly<IJournalEntryRulePermits>;
  destination: Readonly<IJournalEntryRulePermits>;
}> {}
