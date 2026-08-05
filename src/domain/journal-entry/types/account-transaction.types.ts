import { TEntityId } from '../../../shared/types/uuid';
import {
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from './journal-entry.types';
import { IJournalLine } from './journal-line.types';

export interface IAccountTransaction extends IJournalLine {
  header: {
    sourceType: UJournalEntrySourceType;
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
