import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityId } from '../../../shared/types/uuid';
import {
  ILedgerAccountBalance,
  INewLedgerAccountBalanceAndAdjustment,
} from '../types/ledger-account-balance.types';

export default interface ILedgerAccountBalanceRepo {
  create(
    payload: ILedgerAccountBalance,
    repoOptions: IRepoOptions
  ): Promise<void>;

  adjustBalance(
    payload: INewLedgerAccountBalanceAndAdjustment,
    repoOptions: IRepoOptions
  ): Promise<void>;

  findBalanceByAccountId(
    ledgerAccountId: TEntityId,
    accountingEntityId: TEntityId,
    repoOptions: IRepoOptions
  ): Promise<ILedgerAccountBalance | null>;

  // findAdjustmentsByAccountId(
  //   ledgerAccountId: TEntityId,
  //   repoOptions: IRepoOptions
  // ): Promise<ILedgerAccountBalanceAdjustment[]>;
}
