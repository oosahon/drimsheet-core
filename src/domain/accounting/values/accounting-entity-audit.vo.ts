import {
  EAccountingEntityActions,
  IAccountingEntityAudit,
  IMakeAccountingEntityAuditPayload,
} from '@domain/accounting/types/accounting-entity-audit.types';
import accountingAuditHelpers from '@domain/accounting/values/helpers/accounting-audit.vo.helpers';

function make(
  payload: IMakeAccountingEntityAuditPayload
): IAccountingEntityAudit {
  return accountingAuditHelpers.make(payload, EAccountingEntityActions);
}

const accountingEntityAudit = Object.freeze({
  make,
});

export default accountingEntityAudit;
