import { auditSchema, coreSchema } from './schemas';

export const counterpartiesTable = {
  schema: coreSchema,
  name: 'counterparties',
};

export const counterpartyHistoryTable = {
  schema: auditSchema,
  name: 'counterparty_history',
};

export const counterpartyStatus = {
  schema: coreSchema,
  name: 'counter_party_status',
};

export const counterpartyType = {
  schema: coreSchema,
  name: 'counter_party_type',
};
