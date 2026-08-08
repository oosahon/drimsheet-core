import {
  IJournalCounterpartyReq,
  IJournalLineReq,
} from '@app/journal-entry/dtos/journal-entry/journal-entry.dto';

interface IReceiptEntryLineReq extends IJournalLineReq {
  counterparty: IJournalCounterpartyReq;
}

export interface IReceiptEntryReq {
  sourceLine: IReceiptEntryLineReq;
  destinationLines: IReceiptEntryLineReq[];
  effectiveDate: Date;
  postedAt: Date | null;
  memo: string | null;
}
