import { IEvent, TAuditedEntity } from '../../../shared/types/event.types';
import { IEntityDelta } from '../../../shared/types/history.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { ICurrency } from '../../currency/types/currency.types';
import {
  IAssetLedgerAccount,
  ICashAndCashEquivalentAccount,
  IStatutoryReceivableAccount,
} from './asset-account.types';
import { TCashLedgerCode } from './ledger-code.types';
import { ILedgerAccount } from './ledger.types';

interface IMakePettyCashPayload {
  name: string;
  currency: ICurrency;
  isControlAccount: boolean;
  userId: TEntityId;
  accountingEntity: IAccountingEntity;
  controlAccountCode?: TCashLedgerCode;
}

export default interface IAssetAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IReadRepoOptions,
    shouldBootstrapPostingAccounts?: boolean
  ): Promise<{
    accounts: IAssetLedgerAccount[];
    events: IEvent<IAssetLedgerAccount>[];
    audits: IEntityDelta<ILedgerAccount>[];
  }>;

  bootstrapIndividualPostingAccounts(
    accountingEntity: IAccountingEntity,
    headers: { statutoryReceivablesHeader: IStatutoryReceivableAccount },
    repoOptions: IReadRepoOptions
  ): Promise<
    TAuditedEntity<IAssetLedgerAccount, IAssetLedgerAccount, ILedgerAccount>[]
  >;

  makePettyCashSubAccount(
    payload: IMakePettyCashPayload,
    repoOptions: IReadRepoOptions
  ): Promise<
    TAuditedEntity<
      ICashAndCashEquivalentAccount,
      ICashAndCashEquivalentAccount,
      ILedgerAccount
    >
  >;
}
