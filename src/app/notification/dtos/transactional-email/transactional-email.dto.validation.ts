import z from 'zod';

export const transactionalEmailDtoSchema = z.object({
  correlationId: z.string().min(1),
  emails: z.array(z.email()),
  subject: z.string().min(3).max(200),
  html: z.string(),
  templateId: z.string().optional(),
  data: z.record(z.string(), z.string()).optional(),
});
