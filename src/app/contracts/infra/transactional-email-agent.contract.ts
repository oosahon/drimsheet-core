import { ITransactionalEmailDto } from '../dto/workers.dto';

export enum ETransactionalEmailAgent {
  Notifications = 'notifications',
  Osahon = 'osahon',
  NoReply = 'noReply',
}

export default interface ITransactionalEmailAgent {
  send(payload: ITransactionalEmailDto): Promise<void>;
}

export interface IInternalMailer extends ITransactionalEmailAgent {
  send(payload: Omit<ITransactionalEmailDto, 'correlationId'>): Promise<void>;
  getEmail(email: string, subject: string): ITransactionalEmailDto | null;
}
