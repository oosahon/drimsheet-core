import { IUser } from '../../../../domain/user/types/user.types';

export interface IUserSignupReq {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface IAccessToken {
  accessToken: string;
}

export interface IEmailLoginReq {
  email: string;
  password: string;
}

export interface IResetPasswordReq {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface IOAuthProfile {
  email: string;
  firstName: string;
  lastName: string;
}

export type TOAuthDoneCallback = (
  err: Error | null,
  user?: IUser | false
) => void;
