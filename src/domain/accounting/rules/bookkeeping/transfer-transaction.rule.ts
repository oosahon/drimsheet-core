// TODO: move to transfer entry service
import { EJournalSide } from '../../../journal-entry/types/journal-line.types';
import { EAssetAccountBehavior } from '../../../ledger/types/asset-account.types';
import { ILedgerAccount } from '../../../ledger/types/ledger.types';
import accountingError from '../../errors/accounting.error';
import { ITransactionRule } from '../../types/bookkeeping-rule.types';

const { PettyCash, Bank } = EAssetAccountBehavior;

const ALLOWED_BEHAVIORS: string[] = [PettyCash, Bank];

function enforcer(source: ILedgerAccount, destinations: ILedgerAccount[]) {
  if (!ALLOWED_BEHAVIORS.includes(source.behavior)) {
    throw new accountingError.TransferNotPermittedOnAccount({
      cause: { accountId: source.id, subType: source.subType },
    });
  }

  const differentSubTypes = destinations
    .filter((account) => account.subType !== source.subType)
    .map((account) => ({ id: account.id, subType: account.subType }));

  if (differentSubTypes.length > 0) {
    throw new accountingError.TransferNotPermittedOnAccount({
      cause: differentSubTypes,
    });
  }
}

const transferTransactionRule: ITransactionRule = Object.freeze({
  enforce: enforcer,
  getPermittedAccounts() {
    return {
      sources: { behaviors: ALLOWED_BEHAVIORS, subtypes: [] },
      destinations: { behaviors: ALLOWED_BEHAVIORS, subtypes: [] },
    };
  },
  getSides() {
    return {
      source: EJournalSide.Credit,
      destination: EJournalSide.Debit,
    };
  },
});

export default transferTransactionRule;
