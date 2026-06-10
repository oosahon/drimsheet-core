import z from 'zod';
import { ICorrelationId } from '../../../shared/types/correlation-id.types';

export interface ITransactionalEmailDto extends ICorrelationId {
  emails: string[];
  subject: string;
  html: string;
  templateId?: string;
  data?: Record<string, string>;
}

export const transactionalEmailDtoSchema = z.object({
  correlationId: z.string().min(1),
  emails: z.array(z.email()),
  subject: z.string().min(3).max(200),
  html: z.string(),
  templateId: z.string().optional(),
  data: z.record(z.string(), z.string()).optional(),
});
