import { ELedgerAccountBehavior } from '../../ledger/shared/types/account-behaviors.tyypes';
import { ELedgerAccountSubType } from '../../ledger/shared/types/ledger-aggregate.types';
import { ELedgerType } from '../../ledger/shared/types/ledger.types';
import { IJournalEntryRule } from '../types/entry.rules.types';

const openingBalanceEntryRule: IJournalEntryRule = {
  source: {
    permittedTypes: '*',
    permittedSubTypes: '*',
    permittedBehaviors: '*',
  },
  destination: {
    permittedTypes: new Set([ELedgerType.Equity]),
    permittedSubTypes: new Set([ELedgerAccountSubType.OpeningBalance]),
    permittedBehaviors: new Set([ELedgerAccountBehavior.OpeningBalanceEquity]),
  },
};

export default openingBalanceEntryRule;
