import {
  EPeriodActions,
  IAccountingPeriodAudit,
  IMakePeriodAuditPayload,
} from '../types/period-audit.types';
import { IAccountingPeriod } from '../types/period.types';
import accountingAuditHelpers from './helpers/accounting-audit.vo.helpers';

function make(
  payload: IMakePeriodAuditPayload<IAccountingPeriod>
): IAccountingPeriodAudit {
  return accountingAuditHelpers.make(payload, EPeriodActions);
}

const accountingPeriodAudit = Object.freeze({
  make,
});

export default accountingPeriodAudit;
