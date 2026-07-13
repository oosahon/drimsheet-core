import {
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLineReq } from '../journal-entry/journal-entry.dto';

export interface IJournalEntryReq {
  sourceLine: IJournalLineReq;
  // TODO: include counterparty when module is available
  sourceType: UJournalEntrySourceType;
  destinationLines: IJournalLineReq[];
  status: UJournalEntryStatus;
  effectiveDate: Date;
  postedAt: Date | null;
  memo: string | null;
}
