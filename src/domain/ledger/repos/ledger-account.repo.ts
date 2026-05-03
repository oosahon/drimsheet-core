import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { ILedgerAccount, ULedgerType } from '../types/ledger.types';

export interface IFindAllLedgerAccountsOptions extends IRepoOptions {
  type?: ULedgerType;
  subType?: string;
  behavior?: string;
  isControlAccount?: boolean;
  sortBy?: 'accountName' | 'createdAt' | 'balance';
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
