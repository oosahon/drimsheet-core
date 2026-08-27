export const EFileUploadPurpose = {
  JournalEntryAttachment: 'journal_entry_attachment',
} as const;

export type UFileUploadPurpose =
  (typeof EFileUploadPurpose)[keyof typeof EFileUploadPurpose];
