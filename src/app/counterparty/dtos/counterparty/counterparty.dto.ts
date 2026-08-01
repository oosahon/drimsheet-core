import { UCounterpartySortBy } from '../../../../domain/counterparty/repos/counterparty.repo';
import {
  UCounterpartyRole,
  UCounterpartyStatus,
  UCounterpartyType,
} from '../../../../domain/counterparty/types/counterparty.types';
import { IPaginationDto } from '../../../../shared/values/pagination/dto/pagination.dto';

export interface ICounterpartyCreateReq {
  name: string;
  status: UCounterpartyStatus;
  type: UCounterpartyType;
}

export interface ICounterpartyDto {
  id: string;
  accountingEntityId: string;
  name: string;
  status: UCounterpartyStatus;
  type: UCounterpartyType;
  roles: UCounterpartyRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IGetCounterpartiesQuery extends IPaginationDto {
  roles?: UCounterpartyRole[];
  type?: UCounterpartyType;
  status?: UCounterpartyStatus;
  orderBy?: UCounterpartySortBy;
}
