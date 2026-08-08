import { IJournalEntryRule } from '@domain/journal-entry/types/entry.rules.types';
import { EAssetSubType } from '@domain/ledger/types/asset-account.types';
import { ELedgerType } from '@domain/ledger/types/ledger.types';

const receiptEntryRule: IJournalEntryRule = {
  source: {
    permittedTypes: new Set([ELedgerType.Revenue, ELedgerType.Liability]),
    permittedSubTypes: '*',
    permittedBehaviors: '*',
  },
  destination: {
    permittedTypes: new Set([ELedgerType.Asset]),
    permittedSubTypes: new Set([EAssetSubType.CashAndCashEquivalent]),
    permittedBehaviors: '*',
  },
};

export default receiptEntryRule;
