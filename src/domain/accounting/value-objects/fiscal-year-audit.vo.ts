import { IFiscalYear } from '../types/fiscal-year.types';
import {
  EPeriodActions,
  IFiscalYearAudit,
  IMakePeriodAuditPayload,
} from '../types/period-audit.types';
import accountingAuditHelpers from './helpers/accounting-audit.vo.helpers';

function make(payload: IMakePeriodAuditPayload<IFiscalYear>): IFiscalYearAudit {
  return accountingAuditHelpers.make(payload, EPeriodActions);
}

const fiscalYearAudit = Object.freeze({
  make,
});

export default fiscalYearAudit;
