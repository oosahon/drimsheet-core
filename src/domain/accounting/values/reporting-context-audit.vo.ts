import {
  EReportingContextActions,
  IMakeReportingContextAuditPayload,
  IReportingContextAudit,
} from '@domain/accounting/types/reporting-context-audit.types';
import accountingAudit from '@domain/accounting/values/accounting-audit.vo';

function make(
  payload: IMakeReportingContextAuditPayload
): IReportingContextAudit {
  return accountingAudit.make(payload, EReportingContextActions);
}

const reportingContextAudit = Object.freeze({
  make,
});

export default reportingContextAudit;
