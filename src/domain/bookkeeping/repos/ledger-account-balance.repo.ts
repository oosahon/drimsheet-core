import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import {
  ILedgerAccountBalance,
  ILedgerAccountBalanceAdjustment,
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

  findAdjustmentsByAccountId(
    ledgerAccountId: TEntityId,
    repoOptions: IRepoOptions
  ): Promise<ILedgerAccountBalanceAdjustment[]>;
}
