import { TEntityId } from '@shared/types/uuid';

export const EAuthStrategy = {
  Email: 'email',
  Google: 'google',
} as const;

export type UAuthStrategy = (typeof EAuthStrategy)[keyof typeof EAuthStrategy];

export interface IUserAuth {
  userId: TEntityId;
  password: string | null;
  failedLoginAttempts: number;
  strategy: UAuthStrategy[];
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
