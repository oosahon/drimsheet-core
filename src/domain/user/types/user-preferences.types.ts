import { TEntityId } from '../../../shared/types/uuid';

export interface IUserAppPreferences {
  theme: 'light' | 'dark' | 'system';
}

export interface IUserPreferences {
  id: TEntityId;
  appPreferences: IUserAppPreferences;
  createdAt: Date;
  updatedAt: Date;
}
