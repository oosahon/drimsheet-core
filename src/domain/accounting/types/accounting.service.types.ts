import { IMoney } from '../../../shared/types/money.types';
import { IAccountingEntity } from '../../accounting-entity/types/accounting-entity.types';
import { IExchangeRate } from '../../currency/types/exchange-rate.types';
import { ILedgerAccount } from '../../ledger/types/ledger.types';

export interface IOpeningBalanceTransaction {
  accountingEntity: IAccountingEntity;
  account: ILedgerAccount;
  exchangeRate: IExchangeRate | null;
  amount: IMoney;
}

export interface ILedgerAccountBalanceEffectDelta {
  balanceDelta: IMoney;
  functionalBalanceDelta: IMoney;
  affectedLedgerCodes: string[];
}
