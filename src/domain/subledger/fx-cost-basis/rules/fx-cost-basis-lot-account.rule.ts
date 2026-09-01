import { IJournalEntryRulePermits } from '@domain/journal-entry/types/entry.rules.types';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '@domain/ledger/types/asset-account.types';
import { ELedgerType } from '@domain/ledger/types/ledger.types';

const fxCostBasisLotAccountRule: IJournalEntryRulePermits = {
  permittedTypes: new Set([ELedgerType.Asset]),
  permittedSubTypes: new Set([EAssetSubType.CashAndCashEquivalent]),
  permittedBehaviors: new Set([
    EAssetAccountBehavior.Bank,
    EAssetAccountBehavior.PettyCash,
  ]),
};

export default fxCostBasisLotAccountRule;
