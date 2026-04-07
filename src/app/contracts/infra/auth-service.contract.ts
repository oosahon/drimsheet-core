import { TEntityId } from '../../../shared/types/uuid';

export interface IAuthTokenPayload {
  id: TEntityId;
  email: string;
}

export default interface IAuthService {
  hashPassword(password: string): Promise<string>;

  getSignupVerificationLink(user: IAuthTokenPayload): string;

  comparePassword(
    passwordString: string,
    hashedPassword: string
  ): Promise<boolean>;

  generateAuthToken(userData: IAuthTokenPayload): Promise<string>;

  generateRefreshToken(userData: IAuthTokenPayload): Promise<string>;

  generatePasswordResetToken(payload: IAuthTokenPayload): Promise<string>;

  verifyPasswordResetToken(token: string): Promise<IAuthTokenPayload | null>;

  getResetPasswordLink(token: string): string;

  verifyAuthToken(token: string): IAuthTokenPayload;

  getAuthUser(token: string): Promise<IAuthTokenPayload | null>;

  isPermittedEmail(email: string): boolean;
}
