import {
  IPaginatedReadRepoOptions,
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { IPaginatedResponse } from '../../../../shared/values/pagination/types/pagination.types';
import { UAssetSubType } from '../../asset-account/types/asset-account.types';
import { UEquitySubType } from '../../equity-account/types/equity-account.types';
import { UExpenseSubType } from '../../expense-account/types/expense-account.types';
import { ULiabilitySubType } from '../../liability-account/types/liability-account.types';
import { URevenueSubType } from '../../revenue-account/types/revenue-account.types';
import { ILedgerAccountHistory } from '../types/ledger-account-audit.types';
import { ILedgerAccount, ULedgerType } from '../types/ledger.types';

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
    options: IWriteRepoOptions<ILedgerAccountHistory | ILedgerAccountHistory[]>
  ): Promise<void>;

  update(
    account: ILedgerAccount,
    options: IWriteRepoOptions<ILedgerAccountHistory>
  ): Promise<void>;

  findById(
    id: TEntityId,
    accountingEntityId: TEntityId,
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
