import {
  EReportingContextActions,
  IMakeReportingContextAuditPayload,
  IReportingContextAudit,
} from '@domain/accounting/types/reporting-context-audit.types';
import accountingAuditHelpers from '@domain/accounting/values/helpers/accounting-audit.vo.helpers';

function make(
  payload: IMakeReportingContextAuditPayload
): IReportingContextAudit {
  return accountingAuditHelpers.make(payload, EReportingContextActions);
}

const reportingContextAudit = Object.freeze({
  make,
});

export default reportingContextAudit;
