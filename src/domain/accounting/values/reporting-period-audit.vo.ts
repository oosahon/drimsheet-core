import {
  EPeriodActions,
  IMakePeriodAuditPayload,
  IReportingPeriodAudit,
} from '../types/period-audit.types';
import { IReportingPeriod } from '../types/period.types';
import accountingAuditHelpers from './helpers/accounting-audit.vo.helpers';

function make(
  payload: IMakePeriodAuditPayload<IReportingPeriod>
): IReportingPeriodAudit {
  return accountingAuditHelpers.make(payload, EPeriodActions);
}

const reportingPeriodAudit = Object.freeze({
  make,
});

export default reportingPeriodAudit;
