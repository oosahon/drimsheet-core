import { IUser } from '@domain/user/types/user.types';

export default interface IEmailVerificationService {
  send(user: IUser, correlationId: string): Promise<boolean>;
}
