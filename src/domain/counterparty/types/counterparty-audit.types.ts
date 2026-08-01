import {
  IEntityDelta,
  IHistory,
} from '../../../shared/values/history/types/history.types';
import {
  IContractor,
  ICounterparty,
  IEmployer,
  IVendor,
} from './counterparty.types';

export const ECounterpartyEntityActions = {
  Created: 'created',
  Updated: 'updated',
  RoleAdded: 'role-added',
} as const;

export type UCounterpartyEntityActions =
  (typeof ECounterpartyEntityActions)[keyof typeof ECounterpartyEntityActions];

export interface ICounterpartyAudit extends IEntityDelta<ICounterparty> {
  action: UCounterpartyEntityActions;
}

export interface IMakeCounterpartyAuditPayload {
  before: ICounterparty | null;
  after: ICounterparty;
  action: UCounterpartyEntityActions;
}

export interface ICounterpartyHistory extends IHistory<ICounterparty> {}

// Vendor History Types
export const EVendorHistoryAction = {
  Created: 'created',
  Updated: 'updated',
} as const;

export type UVendorHistoryAction =
  (typeof EVendorHistoryAction)[keyof typeof EVendorHistoryAction];

export interface IVendorAudit extends IEntityDelta<IVendor> {
  action: UVendorHistoryAction;
}

export interface IMakeVendorAuditPayload {
  before: IVendor | null;
  after: IVendor;
  action: UVendorHistoryAction;
}

export interface IVendorHistory extends IHistory<IVendor> {}

// Employer History Types
export const EEmployerHistoryAction = {
  Created: 'created',
  Updated: 'updated',
} as const;

export type UEmployerHistoryAction =
  (typeof EEmployerHistoryAction)[keyof typeof EEmployerHistoryAction];

export interface IEmployerAudit extends IEntityDelta<IEmployer> {
  action: UEmployerHistoryAction;
}

export interface IMakeEmployerAuditPayload {
  before: IEmployer | null;
  after: IEmployer;
  action: UEmployerHistoryAction;
}

export interface IEmployerHistory extends IHistory<IEmployer> {}

// Contractor History Types
export const EContractorHistoryAction = {
  Created: 'created',
  Updated: 'updated',
} as const;

export type UContractorHistoryAction =
  (typeof EContractorHistoryAction)[keyof typeof EContractorHistoryAction];

export interface IContractorAudit extends IEntityDelta<IContractor> {
  action: UContractorHistoryAction;
}

export interface IMakeContractorAuditPayload {
  before: IContractor | null;
  after: IContractor;
  action: UContractorHistoryAction;
}

export interface IContractorHistory extends IHistory<IContractor> {}
