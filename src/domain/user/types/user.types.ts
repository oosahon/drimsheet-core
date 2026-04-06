import { TEntityId } from '../../../shared/types/uuid';

export interface IUser {
  id: TEntityId;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IUserWithPassword extends IUser {
  password?: string;
}
