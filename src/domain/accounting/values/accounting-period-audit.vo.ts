import {
  EPeriodActions,
  IAccountingPeriodAudit,
  IMakePeriodAuditPayload,
} from '@domain/accounting/types/period-audit.types';
import { IAccountingPeriod } from '@domain/accounting/types/period.types';
import accountingAudit from '@domain/accounting/values/accounting-audit.vo';

function make(
  payload: IMakePeriodAuditPayload<IAccountingPeriod>
): IAccountingPeriodAudit {
  return accountingAudit.make(payload, EPeriodActions);
}

const accountingPeriodAudit = Object.freeze({
  make,
});

export default accountingPeriodAudit;
