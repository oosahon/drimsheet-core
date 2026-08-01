import {
  UCounterpartyRole,
  UCounterpartyStatus,
  UCounterpartyType,
} from '../../../../domain/counterparty/types/counterparty.types';

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
