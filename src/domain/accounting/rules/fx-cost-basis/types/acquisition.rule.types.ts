import { UJournalEntryStatus } from '../../../../journal-entry/types/journal-entry.types';
import { ILedgerAccount } from '../../../../ledger/shared/types/ledger.types';

interface IHeader {}

export interface IFxCostBasisAcquisitionPayload {
  status: UJournalEntryStatus;
  effectiveDate: Date;
  functionalCurrencyCode: string;
  account: Pick<ILedgerAccount, 'subType' | 'isControlAccount'>;
}
