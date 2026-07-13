import { TEntityWithEvents } from '../../../shared/events/types/event.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IUserPreferences } from './user-preferences.types';

export default interface IUserPreferencesService {
  update(
    userId: TEntityId,
    payload: Partial<IUserPreferences>,
    options: IReadRepoOptions
  ): Promise<TEntityWithEvents<IUserPreferences, IUserPreferences>>;
}
