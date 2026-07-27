import { TAuditedEntity } from '../../../../shared/events/types/event.types';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { IAccountingEntity } from '../../../accounting/types/accounting-entity.types';
import { ICurrency } from '../../../money/types/currency.types';
import { TCashLedgerCode } from '../../shared/types/ledger-code.types';
import { ILedgerAccount } from '../../shared/types/ledger.types';
import { ICashAndCashEquivalentAccount } from './asset-account.types';

interface IMakePettyCashPayload {
  name: string;
  currency: ICurrency;
  isControlAccount: boolean;
  userId: TEntityId;
  accountingEntity: IAccountingEntity;
  controlAccountCode?: TCashLedgerCode;
}

export default interface IAssetAccountService {
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
