export interface ITransactionalEmailPayload {
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
