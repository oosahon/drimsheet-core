import {
  EPeriodActions,
  IMakePeriodAuditPayload,
  IReportingPeriodAudit,
} from '@domain/accounting/types/period-audit.types';
import { IReportingPeriod } from '@domain/accounting/types/period.types';
import accountingAudit from '@domain/accounting/values/accounting-audit.vo';

function make(
  payload: IMakePeriodAuditPayload<IReportingPeriod>
): IReportingPeriodAudit {
  return accountingAudit.make(payload, EPeriodActions);
}

const reportingPeriodAudit = Object.freeze({
  make,
});

export default reportingPeriodAudit;
