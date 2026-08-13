import IAccountingEntityRepo from '@domain/accounting/repos/accounting-entity.repo';
import IUserPreferencesRepo from '@domain/user/repos/user-preferences.repo';

import accountingAppError from '@app/accounting/errors/accounting.error';
import IAppContext from '@app/context/contracts/app-context.contract';

interface IDeps {
  appContext: IAppContext;
  accountingEntityRepo: IAccountingEntityRepo;
  userPreferencesRepo: IUserPreferencesRepo;
}

export default function makeGetCurrentAccountingEntityUseCase(deps: IDeps) {
  return async () => {
    const { correlationId, user } = deps.appContext.get();
    const repoOptions = { correlationId };

    const preferences = await deps.userPreferencesRepo.findById(
      user.id,
      repoOptions
    );

    const accountingEntityId = preferences?.lastActiveAccountingEntityId;

    if (!accountingEntityId) {
      throw new accountingAppError.ActiveEntityNotFound();
    }

    const accountingEntity = await deps.accountingEntityRepo.findByIdAndUserId(
      accountingEntityId,
      user.id,
      repoOptions
    );

    if (!accountingEntity) {
      throw new accountingAppError.ActiveEntityNotFound();
    }

    return accountingEntity;
  };
}
