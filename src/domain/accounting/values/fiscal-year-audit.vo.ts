import { IFiscalYear } from '@domain/accounting/types/fiscal-year.types';
import {
  EPeriodActions,
  IFiscalYearAudit,
  IMakePeriodAuditPayload,
} from '@domain/accounting/types/period-audit.types';
import accountingAudit from '@domain/accounting/values/accounting-audit.vo';

function make(payload: IMakePeriodAuditPayload<IFiscalYear>): IFiscalYearAudit {
  return accountingAudit.make(payload, EPeriodActions);
}

const fiscalYearAudit = Object.freeze({
  make,
});

export default fiscalYearAudit;
