import {
  EPeriodActions,
  IAccountingPeriodAudit,
  IMakePeriodAuditPayload,
} from '@domain/accounting/types/period-audit.types';
import { IAccountingPeriod } from '@domain/accounting/types/period.types';
import accountingAuditHelpers from '@domain/accounting/values/helpers/accounting-audit.vo.helpers';

function make(
  payload: IMakePeriodAuditPayload<IAccountingPeriod>
): IAccountingPeriodAudit {
  return accountingAuditHelpers.make(payload, EPeriodActions);
}

const accountingPeriodAudit = Object.freeze({
  make,
});

export default accountingPeriodAudit;
