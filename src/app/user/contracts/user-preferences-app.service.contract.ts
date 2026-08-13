import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import { IEvent } from '@shared/values/events/types/event.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import { IUserPreferences } from '@domain/user/types/user-preferences.types';

/** The committed preference change and its post-commit publication work. */
export interface IActiveAccountingEntityPreferenceUpdate {
  /** The canonical entity after confirming that it belongs to the user. */
  accountingEntity: IAccountingEntity;
  /** Preference events the caller publishes only after the transaction ends. */
  events: readonly IEvent<IUserPreferences>[];
}

/**
 * Manages the user's durable active-accounting-entity preference.
 *
 * Callers publish returned preference events only after the write commits.
 * Missing guaranteed preferences reject as an internal consistency fault.
 */
export default interface IUserPreferencesAppService {
  /**
   * Ownership-checks an accounting entity and persists it as the user's active
   * preference. The operation owns a transaction or reuses `repoOptions.tx`,
   * locks the preference row, and rejects without writing when the entity is
   * not owned by the user.
   */
  setActiveAccountingEntity(
    userId: TEntityId,
    accountingEntityId: TEntityId,
    repoOptions: IWriteRepoOptions
  ): Promise<IActiveAccountingEntityPreferenceUpdate>;

  /**
   * Gets the accounting entity for request-context initialization without
   * writing preferences. A supplied explicit ID is authoritative and is never
   * allowed to fall back to the stored preference. Without an explicit ID, the
   * stored preference is ownership-checked; null or stale selections return
   * null.
   */
  getActiveAccountingEntity(
    userId: TEntityId,
    explicitAccountingEntityId: TEntityId | undefined,
    repoOptions: IReadRepoOptions
  ): Promise<IAccountingEntity | null>;
}
