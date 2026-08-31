import { auditSchema, coreSchema } from './schemas';

export const subledgerFxCostBasisLotsTable = {
  schema: coreSchema,
  name: 'subledger_fx_cost_basis_lots',
};

export const subledgerFxCostBasisLotStatus = {
  schema: coreSchema,
  name: 'subledger_fx_cost_basis_lot_status',
};

export const subledgerFxCostBasisLotHistoryTable = {
  schema: auditSchema,
  name: 'subledger_fx_cost_basis_lot_history',
};

export const subledgerFxCostBasisLotAcquisitionsTable = {
  schema: coreSchema,
  name: 'subledger_fx_cost_basis_lot_acquisitions',
};

export const subledgerFxCostBasisLotAcquisitionHistoryTable = {
  schema: auditSchema,
  name: 'subledger_fx_cost_basis_lot_acquisition_history',
};

export const subledgerFxCostBasisLotDispositionsTable = {
  schema: coreSchema,
  name: 'subledger_fx_cost_basis_lot_dispositions',
};

export const subledgerFxCostBasisLotDispositionHistoryTable = {
  schema: auditSchema,
  name: 'subledger_fx_cost_basis_lot_disposition_history',
};

export const subledgerFxCostBasisLotDispositionAllocationsTable = {
  schema: coreSchema,
  name: 'subledger_fx_cost_basis_lot_disposition_allocations',
};
