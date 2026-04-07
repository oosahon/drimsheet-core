import { ICorrelationId } from '../../../shared/types/correlation-id.types';

export interface ITransactionalEmailPayload extends ICorrelationId {
  emails: string[];
  subject: string;
  html: string;
  templateId?: string;
  data?: Record<string, string>;
}

export interface IQueue {
  addTransactionalEmail(payload: ITransactionalEmailPayload): void;
}
