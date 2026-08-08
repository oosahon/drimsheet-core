import { UJournalEntryStatus } from '@domain/journal-entry/types/journal-entry.types';

import { IJournalLineReq } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto';

export interface ITransactionJournalEntryReq {
  sourceLine: IJournalLineReq;
  destinationLines: IJournalLineReq[];
  status: UJournalEntryStatus;
  effectiveDate: Date;
  postedAt: Date | null;
  memo: string | null;
}
