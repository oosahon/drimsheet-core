import { ITransactionalEmailDto } from '../dtos/transactional-email.dto';

export const TRANSACTIONAL_EMAIL_QUEUE_NAME =
  'transactional-email-queue' as const;

export default interface ITransactionalEmailQueue {
  add(payload: ITransactionalEmailDto): Promise<void>;
}
