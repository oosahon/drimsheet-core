import z from 'zod';

export const journalEntryDeletionReqValidation = z
  .object({
    expectedVersion: z.number().int().positive(),
  })
  .strict();
