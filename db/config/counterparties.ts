import { auditSchema, coreSchema } from './schemas';

export const counterpartiesTable = {
  schema: coreSchema,
  name: 'counterparties',
};

export const counterpartyHistoryTable = {
  schema: auditSchema,
  name: 'counterparty_history',
};

export const counterpartyRolesTable = {
  schema: coreSchema,
  name: 'counterparty_roles',
};

export const counterpartyStatus = {
  schema: coreSchema,
  name: 'counter_party_status',
};

export const counterpartyType = {
  schema: coreSchema,
  name: 'counter_party_type',
};

export const counterpartyRole = {
  schema: coreSchema,
  name: 'counter_party_role',
};

export const counterpartyEmployerTable = {
  schema: coreSchema,
  name: 'counterparty_employers',
};

export const counterpartyVendorsTable = {
  schema: coreSchema,
  name: 'counterparty_vendors',
};

export const counterpartyContractorTable = {
  schema: coreSchema,
  name: 'counterparty_contractors',
};

export const counterpartyVendorHistoryTable = {
  schema: auditSchema,
  name: 'counterparty_vendor_history',
};

export const counterpartyEmployerHistoryTable = {
  schema: auditSchema,
  name: 'counterparty_employer_history',
};

export const counterpartyContractorHistoryTable = {
  schema: auditSchema,
  name: 'counterparty_contractor_history',
};
