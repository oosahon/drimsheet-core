import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { UAssetSubType } from '../types/asset-account.types';
import { UEquitySubType } from '../types/equity-account.types';
import { UExpenseSubType } from '../types/expense-account.types';
import { ILedgerAccount, ULedgerType } from '../types/ledger.types';
import { ULiabilitySubType } from '../types/liability-account.types';
import { URevenueSubType } from '../types/revenue-account.types';

export const ELedgerAccountSortBy = {
  AccountName: 'accountName',
  CreatedAt: 'createdAt',
  Balance: 'balance',
} as const;

export type ULedgerAccountSortBy =
  (typeof ELedgerAccountSortBy)[keyof typeof ELedgerAccountSortBy];

export interface IFindAllLedgerAccountsOptions extends Omit<
  IRepoOptions,
  'orderBy'
> {
  ids?: TEntityId[];
  type?: ULedgerType;
  subType?:
    | UAssetSubType
    | ULiabilitySubType
    | UEquitySubType
    | URevenueSubType
    | UExpenseSubType;
  behavior?: string;
  isControlAccount?: boolean;
  orderBy?: ULedgerAccountSortBy;
}

export default interface ILedgerAccountRepo {
  save(
    account: ILedgerAccount | ILedgerAccount[],
    options: IRepoOptions
  ): Promise<void>;

  findById(
    id: TEntityId,
    options: IRepoOptions
  ): Promise<ILedgerAccount | null>;

  findAllByIds(
    ids: TEntityId[],
    options: IRepoOptions
  ): Promise<ILedgerAccount[]>;

  findByCode(
    code: string,
    accountingEntityId: TEntityId,
    options: IRepoOptions
  ): Promise<ILedgerAccount | null>;

  findBySubType(
    accountingEntityId: TEntityId,
    type: ULedgerType,
    subType: string,
    options: IRepoOptions
  ): Promise<ILedgerAccount[]>;

  findByBehavior(
    accountingEntityId: TEntityId,
    behavior: string,
    options: IRepoOptions
  ): Promise<ILedgerAccount[]>;

  findLatestBySubType(
    accountingEntityId: TEntityId,
    type: ULedgerType,
    subType: string,
    options: IRepoOptions
  ): Promise<Pick<ILedgerAccount, 'id' | 'code' | 'materializedPath'> | null>;

  findAll(
    accountingEntityId: TEntityId,
    options: IFindAllLedgerAccountsOptions
  ): Promise<IPaginatedResponse<ILedgerAccount>>;
}
