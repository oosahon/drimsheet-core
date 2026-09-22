import z from 'zod';

export const journalEntryArchiveReqValidation = z
  .object({
    expectedVersion: z.number().int().positive(),
  })
  .strict();
