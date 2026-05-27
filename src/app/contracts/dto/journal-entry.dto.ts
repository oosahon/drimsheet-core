import z from 'zod';
import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
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
  new journalEntryError.InvalidSourceType().errorKey
);
