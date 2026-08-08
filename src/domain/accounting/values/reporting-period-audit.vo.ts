import {
  EPeriodActions,
  IMakePeriodAuditPayload,
  IReportingPeriodAudit,
} from '@domain/accounting/types/period-audit.types';
import { IReportingPeriod } from '@domain/accounting/types/period.types';
import accountingAuditHelpers from '@domain/accounting/values/helpers/accounting-audit.vo.helpers';

function make(
  payload: IMakePeriodAuditPayload<IReportingPeriod>
): IReportingPeriodAudit {
  return accountingAuditHelpers.make(payload, EPeriodActions);
}

const reportingPeriodAudit = Object.freeze({
  make,
});

export default reportingPeriodAudit;
