import { TEntityId } from '@shared/types/uuid';

export interface IUser {
  createdBy: TEntityId;
  actorId: TEntityId;
  id: TEntityId;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
