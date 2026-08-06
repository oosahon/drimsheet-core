import {
  IPaginatedReadRepoOptions,
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IPaginatedResponse } from '../../../shared/values/pagination/types/pagination.types';
import { ICounterpartyHistory } from '../types/counterparty-audit.types';
import {
  ICounterparty,
  UCounterpartyRole,
  UCounterpartyStatus,
  UCounterpartyType,
} from '../types/counterparty.types';

export const ECounterpartySortBy = {
  Name: 'name',
  CreatedAt: 'createdAt',
} as const;

export type UCounterpartySortBy =
  (typeof ECounterpartySortBy)[keyof typeof ECounterpartySortBy];

export interface IFindAllOptions extends Omit<
  IPaginatedReadRepoOptions,
  'orderBy'
> {
  roles?: UCounterpartyRole[];
  type?: UCounterpartyType;
  status?: UCounterpartyStatus;
  orderBy?: UCounterpartySortBy;
}

export default interface ICounterpartyRepo {
  create(
    payload: ICounterparty,
    repoOptions: IWriteRepoOptions<ICounterpartyHistory>
  ): Promise<void>;

  findAll(
    accountingEntityId: TEntityId,
    options: IFindAllOptions
  ): Promise<IPaginatedResponse<ICounterparty>>;

  findById(
    id: TEntityId,
    accountingEntityId: TEntityId,
    options: IReadRepoOptions
  ): Promise<ICounterparty | null>;
}
