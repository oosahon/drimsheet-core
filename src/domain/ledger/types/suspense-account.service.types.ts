import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import { ICurrency } from '../../money/types/currency.types';
import { IAssetSuspenseAccount } from './asset-account.types';
import { ILedgerAccount } from './ledger.types';
import { ILiabilitySuspenseAccount } from './liability-account.types';

interface IMakePayload {
  name: string;
  createdBy: TEntityId;
  accountingEntityId: TEntityId;
  // TODO: remove currency from suspense account
  currency: ICurrency;
}

export interface ISuspenseAccountService {
  createAssetSuspense(
    payload: IMakePayload,
    repoOptions: IRepoOptions
  ): Promise<
    TAuditedEntity<IAssetSuspenseAccount, IAssetSuspenseAccount, ILedgerAccount>
  >;

  createLiabilitySuspense(
    payload: IMakePayload,
    repoOptions: IRepoOptions
  ): Promise<
    TAuditedEntity<
      ILiabilitySuspenseAccount,
      ILiabilitySuspenseAccount,
      ILedgerAccount
    >
  >;
}
