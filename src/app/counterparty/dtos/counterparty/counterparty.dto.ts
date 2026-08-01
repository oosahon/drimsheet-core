import {
  UCounterpartyRole,
  UCounterpartyStatus,
  UCounterpartyType,
} from '../../../../domain/counterparty/types/counterparty.types';

export interface ICounterpartyCreateReq {
  id: string;
  name: string;
  status: UCounterpartyStatus;
  type: UCounterpartyType;
  createdAt: Date;
  updatedAt: Date;
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
