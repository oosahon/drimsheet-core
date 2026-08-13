import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import { ERepoLock } from '@shared/types/repo.types';

import IAccountingEntityRepo from '@domain/accounting/repos/accounting-entity.repo';
import userPreferencesEntity from '@domain/user/entities/user-preferences.entity';
import IUserPreferencesRepo from '@domain/user/repos/user-preferences.repo';

import accountingAppError from '@app/accounting/errors/accounting.error';
import IUserPreferencesAppService, {
  IActiveAccountingEntityPreferenceUpdate,
} from '@app/user/contracts/user-preferences-app.service.contract';
import userPreferencesAppError from '@app/user/errors/user-preferences.error';

interface IDependencies {
  accountingEntityRepo: IAccountingEntityRepo;
  userPreferencesRepo: IUserPreferencesRepo;
  repoService: IRepoService;
}

function makeSetActiveAccountingEntity(
  deps: IDependencies
): IUserPreferencesAppService['setActiveAccountingEntity'] {
  return async (userId, accountingEntityId, repoOptions) => {
    // Keep the ownership check and preference write in the same transaction.
    const transactionFn: TRepoTransactionFn<
      IActiveAccountingEntityPreferenceUpdate
    > = async (tx) => {
      const transactionOptions = { ...repoOptions, tx };

      const accountingEntity =
        await deps.accountingEntityRepo.findByIdAndUserId(
          accountingEntityId,
          userId,
          transactionOptions
        );

      if (!accountingEntity) {
        throw new accountingAppError.ActiveEntityNotFound();
      }

      const preferences = await deps.userPreferencesRepo.findById(userId, {
        ...transactionOptions,
        lock: ERepoLock.Update,
      });

      if (!preferences) {
        throw new userPreferencesAppError.Inconsistent();
      }

      const [updatedPreferences, events] = userPreferencesEntity.update(
        preferences,
        { lastActiveAccountingEntityId: accountingEntity.id }
      );

      await deps.userPreferencesRepo.update(
        updatedPreferences,
        transactionOptions
      );

      return { accountingEntity, events };
    };

    return await deps.repoService.runInTransaction(
      transactionFn,
      repoOptions.tx
    );
  };
}

function makeGetActiveAccountingEntity(
  deps: IDependencies
): IUserPreferencesAppService['getActiveAccountingEntity'] {
  return async (userId, explicitAccountingEntityId, repoOptions) => {
    // An explicit request override is authoritative, including a failed lookup.
    if (explicitAccountingEntityId !== undefined) {
      return await deps.accountingEntityRepo.findByIdAndUserId(
        explicitAccountingEntityId,
        userId,
        repoOptions
      );
    }

    const preferences = await deps.userPreferencesRepo.findById(
      userId,
      repoOptions
    );

    if (!preferences) {
      throw new userPreferencesAppError.Inconsistent();
    }

    if (preferences.lastActiveAccountingEntityId === null) {
      return null;
    }

    return await deps.accountingEntityRepo.findByIdAndUserId(
      preferences.lastActiveAccountingEntityId,
      userId,
      repoOptions
    );
  };
}

/**
 * Builds the application capability that owns durable user preference reads
 * and writes for the active accounting entity.
 */
export default function makeUserPreferencesAppService(
  deps: IDependencies
): IUserPreferencesAppService {
  return Object.freeze({
    setActiveAccountingEntity: makeSetActiveAccountingEntity(deps),
    getActiveAccountingEntity: makeGetActiveAccountingEntity(deps),
  });
}
