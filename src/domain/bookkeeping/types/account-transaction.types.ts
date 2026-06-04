import { TEntityId } from '../../../shared/types/uuid';
import {
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from '../../journal-entry/types/journal-entry.types';
import { IJournalLine } from '../../journal-entry/types/journal-line.types';

export interface IAccountTransaction extends IJournalLine {
  header: {
    sourceType: UJournalEntrySourceType;
    counterPartyId: TEntityId | null;
    memo: string | null;
    status: UJournalEntryStatus;
    effectiveDate: Date;
    postedAt: Date | null;
    voidedAt: Date | null;
    voidingEntryId: TEntityId | null;
    version: number;
    createdBy: TEntityId;
    createdAt: Date;
    updatedAt: Date;
  };
}
