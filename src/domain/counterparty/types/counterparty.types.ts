import { TEntityId } from '../../../shared/types/uuid';

export const ECounterpartyStatus = {
  Active: 'active',
  Archived: 'archived',
};

export type UCounterpartyStatus =
  (typeof ECounterpartyStatus)[keyof typeof ECounterpartyStatus];

export interface ICounterparty {
  id: TEntityId;
  accountingEntityId: TEntityId;
  name: string;
  status: UCounterpartyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployerDetails {
  counterpartyId: TEntityId;
  legalName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVendorContactPerson {
  name: string;
}

export interface IVendorDetails {
  counterpartyId: TEntityId;
  legalName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerDetails {
  counterpartyId: TEntityId;
  legalName: string;
  createdAt: Date;
  updatedAt: Date;
}
