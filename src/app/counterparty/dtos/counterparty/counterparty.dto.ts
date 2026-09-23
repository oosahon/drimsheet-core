import { IAddressDto } from '@shared/values/contact-details/dto/address.dto';
import { IPaginationDto } from '@shared/values/pagination/dto/pagination.dto';

import { UCounterpartySortBy } from '@domain/counterparty/repos/counterparty.repo';
import {
  UCounterpartyRole,
  UCounterpartyStatus,
  UCounterpartyType,
} from '@domain/counterparty/types/counterparty.types';

export interface ICounterpartyCreateReq {
  name: string;
  status: UCounterpartyStatus;
  type: UCounterpartyType;
  meta?: ICounterpartyCreateMetaReq;
}

interface ICounterpartyCreateMetaReq {
  employer?: { displayName?: string | null; address: IAddressDto };
  vendor?: { address?: IAddressDto | null };
  contractor?: { address: IAddressDto };
}

interface ICounterpartyMetaDto {
  employer?: { displayName: string | null; address: IAddressDto };
  vendor?: { address: IAddressDto | null };
  contractor?: { address: IAddressDto };
}

export interface ICounterpartyDto {
  id: string;
  accountingEntityId: string;
  name: string;
  status: UCounterpartyStatus;
  type: UCounterpartyType;
  roles: UCounterpartyRole[];
  meta: ICounterpartyMetaDto;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGetCounterpartiesQuery extends IPaginationDto {
  roles?: UCounterpartyRole[];
  type?: UCounterpartyType;
  status?: UCounterpartyStatus;
  orderBy?: UCounterpartySortBy;
}
