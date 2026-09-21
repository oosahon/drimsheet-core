import { IJournalEntryRectificationResult } from '@domain/journal-entry/types/journal-entry-rectification.types';

import journalEntryDtoMapper from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.mapper';

import { IJournalEntryRectificationDto } from './journal-entry-rectification.dto';

const journalEntryRectificationDtoMapper = {
  toDto(
    result: IJournalEntryRectificationResult
  ): IJournalEntryRectificationDto {
    return {
      mode: result.mode,
      originalJournalEntryId: result.originalJournalEntryId,
      currentJournalEntryId: result.currentJournalEntry.id,
      reversingJournalEntryId: result.reversingJournalEntry?.id ?? null,
      journalEntry: journalEntryDtoMapper.toDto(result.currentJournalEntry),
    };
  },
};

export default journalEntryRectificationDtoMapper;
