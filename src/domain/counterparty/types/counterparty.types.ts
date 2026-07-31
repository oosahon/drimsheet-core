import { TEntityId } from '../../../shared/types/uuid';
import { IAddress } from '../../../shared/values/contact-details/types/address.types';

export const ECounterpartyStatus = {
  Active: 'active',
  Archived: 'archived',
} as const;

export type UCounterpartyStatus =
  (typeof ECounterpartyStatus)[keyof typeof ECounterpartyStatus];

export const ECounterpartyType = {
  Individual: 'individual',
  Organization: 'organization',
} as const;

export type UCounterpartyType =
  (typeof ECounterpartyType)[keyof typeof ECounterpartyType];

export const ECounterpartyRole = {
  Employer: 'employer',
  Vendor: 'vendor',
  Contractor: 'contractor',
} as const;

export type UCounterpartyRole =
  (typeof ECounterpartyRole)[keyof typeof ECounterpartyRole];

export interface ICounterparty {
  id: TEntityId;
  accountingEntityId: TEntityId;
  name: string;
  status: UCounterpartyStatus;
  type: UCounterpartyType;
  roles: UCounterpartyRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployerDetails {
  counterPartyId: TEntityId;
  displayName: string | null;
  address: IAddress;
  createdAt: Date;
}

export interface IVendorDetails {
  counterPartyId: TEntityId;
  address: IAddress | null;
  createdAt: Date;
}

export interface IContractorDetails {
  counterPartyId: TEntityId;
  address: IAddress;
  createdAt: Date;
}

export interface IMakeCounterpartyPayload {
  accountingEntityId: TEntityId;
  name: string;
  type: UCounterpartyType;
  status?: UCounterpartyStatus;
}

export interface IMakeEmployerDetailsPayload {
  counterPartyId: TEntityId;
  displayName?: string | null;
  address: IAddress;
}

export interface IMakeVendorDetailsPayload {
  counterPartyId: TEntityId;
  address?: IAddress | null;
}

export interface IMakeContractorDetailsPayload {
  counterPartyId: TEntityId;
  address: IAddress;
}
