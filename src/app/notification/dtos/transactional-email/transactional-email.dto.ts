import { ICorrelationId } from '../../../../shared/types/correlation-id.types';

export interface ITransactionalEmailDto extends ICorrelationId {
  emails: string[];
  subject: string;
  html: string;
  templateId?: string;
  data?: Record<string, string>;
}
