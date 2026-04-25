import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { ILedgerAccountBalance } from '../types/ledger-account-balance.types';

export default interface ILedgerAccountBalanceRepo {
  create(
    payload: ILedgerAccountBalance,
    repoOptions: IRepoOptions
  ): Promise<void>;

  // adjustBalance(
  //   payload: ILedgerAccountBalanceAdjustment,
  //   repoOptions: IRepoOptions
  // ): Promise<void>;

  // findBalanceByAccountId(
  //   ledgerAccountId: TEntityId,
  //   repoOptions: IRepoOptions
  // ): Promise<ILedgerAccountBalance | null>;

  // findAdjustmentsByAccountId(
  //   ledgerAccountId: TEntityId,
  //   repoOptions: IRepoOptions
  // ): Promise<ILedgerAccountBalanceAdjustment[]>;
}
