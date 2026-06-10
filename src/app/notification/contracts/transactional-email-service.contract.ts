import { IUser } from '../../../domain/user/types/user.types';
import { ICorrelationId } from '../../../shared/types/correlation-id.types';

interface IEmailVerificationPayload extends ICorrelationId {
  user: IUser;
  verificationLink: string;
}

interface IPasswordResetPayload extends ICorrelationId {
  user: IUser;
  resetLink: string;
}

export default interface ITransactionalEmailService {
  sendEmailVerification(payload: IEmailVerificationPayload): Promise<void>;
  sendPasswordResetLink(payload: IPasswordResetPayload): Promise<void>;
}
