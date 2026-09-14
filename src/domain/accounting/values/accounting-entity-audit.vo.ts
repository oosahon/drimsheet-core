import {
  EAccountingEntityActions,
  IAccountingEntityAudit,
  IMakeAccountingEntityAuditPayload,
} from '@domain/accounting/types/accounting-entity-audit.types';
import accountingAudit from '@domain/accounting/values/accounting-audit.vo';

function make(
  payload: IMakeAccountingEntityAuditPayload
): IAccountingEntityAudit {
  return accountingAudit.make(payload, EAccountingEntityActions);
}

const accountingEntityAudit = Object.freeze({
  make,
});

export default accountingEntityAudit;
