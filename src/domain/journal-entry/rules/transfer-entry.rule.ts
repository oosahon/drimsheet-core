import { IJournalEntryRule } from '@domain/journal-entry/types/entry.rules.types';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '@domain/ledger/types/asset-account.types';
import { ELedgerType } from '@domain/ledger/types/ledger.types';

const permittedTypes = new Set([ELedgerType.Asset]);

const permittedSubTypes = new Set([EAssetSubType.CashAndCashEquivalent]);

const permittedBehaviors = new Set([
  EAssetAccountBehavior.Bank,
  EAssetAccountBehavior.PettyCash,
]);

const transferEntryRule: IJournalEntryRule = {
  source: {
    permittedTypes,
    permittedSubTypes,
    permittedBehaviors,
  },
  destination: {
    permittedTypes,
    permittedSubTypes,
    permittedBehaviors,
  },
};

export default transferEntryRule;
