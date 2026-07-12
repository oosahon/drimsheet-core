import { IJournalEntry } from '../../../journal-entry/types/journal-entry.types';
import { ILedgerAccount } from '../../../ledger/shared/types/ledger.types';

export interface IFxCostBasisAcquisitionRuleEntry {}

function enforcer(journalEntry: IJournalEntry, account: ILedgerAccount) {}

const fxCostBasisLotRule = Object.freeze({
  enforce: enforcer,
});

export default fxCostBasisLotRule;
