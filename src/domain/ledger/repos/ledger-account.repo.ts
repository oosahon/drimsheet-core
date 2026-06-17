import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import {
  IPaginatedReadRepoOptions,
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { UAssetSubType } from '../types/asset-account.types';
import { UEquitySubType } from '../types/equity-account.types';
import { UExpenseSubType } from '../types/expense-account.types';
import { ILedgerAccountHistory } from '../types/ledger-account-audit.types';
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
  IPaginatedReadRepoOptions,
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
  create(
    account: ILedgerAccount | ILedgerAccount[],
    options: IWriteRepoOptions<ILedgerAccountHistory[]>
  ): Promise<void>;

  findById(
    id: TEntityId,
    options: IReadRepoOptions
  ): Promise<ILedgerAccount | null>;

  findAllByIds(
    ids: TEntityId[],
    options: IReadRepoOptions
  ): Promise<ILedgerAccount[]>;

  findByCode(
    code: string,
    accountingEntityId: TEntityId,
    options: IReadRepoOptions
  ): Promise<ILedgerAccount | null>;

  findBySubType(
    accountingEntityId: TEntityId,
    type: ULedgerType,
    subType: string,
    options: IReadRepoOptions
  ): Promise<ILedgerAccount[]>;

  findByBehavior(
    accountingEntityId: TEntityId,
    behavior: string,
    options: IReadRepoOptions
  ): Promise<ILedgerAccount[]>;

  findLatestBySubType(
    accountingEntityId: TEntityId,
    type: ULedgerType,
    subType: string,
    options: IReadRepoOptions
  ): Promise<Pick<ILedgerAccount, 'id' | 'code' | 'materializedPath'> | null>;

  findAll(
    accountingEntityId: TEntityId,
    options: IFindAllLedgerAccountsOptions
  ): Promise<IPaginatedResponse<ILedgerAccount>>;
}
