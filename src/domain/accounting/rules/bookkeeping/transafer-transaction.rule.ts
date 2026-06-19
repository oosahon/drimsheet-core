import { EAssetAccountBehavior } from '../../../ledger/types/asset-account.types';
import { ILedgerAccount } from '../../../ledger/types/ledger.types';
import accountingError from '../../errors/accounting.error';

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

const transferTransactionRule = Object.freeze({
  permittedSrouces: {
    behaviors: ALLOWED_BEHAVIORS,
  },
  permittedDestinations: {
    behaviors: ALLOWED_BEHAVIORS,
  },
  enforce: enforcer,
});

export default transferTransactionRule;
