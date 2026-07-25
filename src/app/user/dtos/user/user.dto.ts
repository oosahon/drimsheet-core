import { TEntityId } from '../../../../shared/types/uuid';

export interface IUserProfileDto {
  id: TEntityId;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}
