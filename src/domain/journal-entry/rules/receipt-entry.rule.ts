import { EAssetSubType } from '../../ledger/asset-account/types/asset-account.types';
import { ELedgerType } from '../../ledger/shared/types/ledger.types';
import { IJournalEntryRule } from '../types/entry.rules.types';

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
