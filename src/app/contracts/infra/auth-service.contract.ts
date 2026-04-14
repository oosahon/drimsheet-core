import { TEntityId } from '../../../shared/types/uuid';

export interface IAuthTokenPayload {
  id: TEntityId;
}

export interface IUserAuth {
  userId: TEntityId;
  password: string | null;
  failedLoginAttempts: number;
  strategy: ('email' | 'google')[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSession {
  id: TEntityId;
  userId: TEntityId;
  refreshToken: string;
  lastLoginAt: Date;
  createdAt: Date;
}

export default interface IAuthService {
  hashPassword(password: string): Promise<string>;

  generateSignupToken(user: IAuthTokenPayload): Promise<string>;

  verifySignupToken(token: string): Promise<IAuthTokenPayload | null>;

  comparePassword(
    passwordString: string,
    hashedPassword: string
  ): Promise<boolean>;

  generateAccessToken(userData: IAuthTokenPayload): Promise<string>;

  generateRefreshToken(userData: IAuthTokenPayload): Promise<string>;

  generatePasswordResetToken(payload: IAuthTokenPayload): Promise<string>;

  verifyPasswordResetToken(token: string): Promise<IAuthTokenPayload | null>;

  verifyAuthToken(token: string): IAuthTokenPayload;

  getAuthUser(token: string): Promise<IAuthTokenPayload | null>;

  isPermittedEmail(email: string): boolean;
}
