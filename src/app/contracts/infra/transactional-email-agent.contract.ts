import { ICorrelationId } from '../../../shared/types/correlation-id.types';

export interface ITransactionalEmailPayload extends ICorrelationId {
  emails: string[];
  subject: string;
  html: string;
  templateId?: string;
  data?: Record<string, string>;
}

export enum ETransactionalEmailAgent {
  Notifications = 'notifications',
  Osahon = 'osahon',
  NoReply = 'noReply',
}

export default interface ITransactionalEmailAgent {
  send(payload: ITransactionalEmailPayload): Promise<void>;
}

export interface IInternalMailer {
  send(payload: Omit<ITransactionalEmailPayload, 'correlationId'>): void;
  getEmail(email: string, subject: string): ITransactionalEmailPayload | null;
}
