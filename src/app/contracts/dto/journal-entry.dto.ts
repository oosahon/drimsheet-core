import z from 'zod';
import {
  EJournalEntrySourceType,
  UJournalEntrySourceType,
} from '../../../domain/journal-entry/types/journal-entry.types';

/**
 * Journal entry source type validation schema
 */
export const journalEntrySourceTypeValidation = z.enum(
  Object.values(EJournalEntrySourceType) as [
    UJournalEntrySourceType,
    ...UJournalEntrySourceType[],
  ],
  'Invalid journal entry source type'
);
