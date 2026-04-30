import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IUserPreferences } from './user-preferences.types';

export default interface IUserPreferencesService {
  update(
    userId: TEntityId,
    payload: Partial<IUserPreferences>,
    options: IRepoOptions
  ): Promise<TEntityWithEvents<IUserPreferences, IUserPreferences>>;
}
