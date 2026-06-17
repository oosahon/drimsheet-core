import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { ICurrency } from '../../currency/types/currency.types';
import { ILedgerAccountBalance } from './ledger-account-balance.types';
import { ILedgerAccount } from './ledger.types';

export default interface IAccountBalanceService {
  createBalance(
    ledgerAccount: ILedgerAccount,
    functionalCurrency: ICurrency,
    repoOptions: IReadRepoOptions
  ): Promise<ILedgerAccountBalance>;
}
