import { TEntityId } from '@shared/types/uuid';
import zodValidationRunner from '@shared/utils/zod-validation-runner';

import IAccountingEntityRepo from '@domain/accounting/repos/accounting-entity.repo';

import { IAccountingEntitySwitchReq } from '@app/accounting/dtos/accounting/accounting.dto';
import { accountingEntitySwitchReqSchema } from '@app/accounting/dtos/accounting/accounting.dto.validation';
import accountingAppError from '@app/accounting/errors/accounting.error';
import IAppContext from '@app/context/contracts/app-context.contract';
import IUserPreferencesService from '@app/user/contracts/user-preferences.service.contract';

interface IDependencies {
  appContext: IAppContext;
  accountingEntityRepo: IAccountingEntityRepo;
  userPreferencesService: IUserPreferencesService;
}

export default function makeSwitchAccountingEntityUsecase(deps: IDependencies) {
  return async (payload: IAccountingEntitySwitchReq) => {
    zodValidationRunner(accountingEntitySwitchReqSchema, payload);

    const { user, correlationId } = deps.appContext.get(['user']);

    const accountingEntity = await deps.accountingEntityRepo.findByIdAndUserId(
      payload.accountingEntityId as TEntityId,
      user.id,
      { correlationId }
    );

    if (!accountingEntity) {
      throw new accountingAppError.ActiveEntityNotFound();
    }

    const updatePayload = {
      userId: user.id,
      createdBy: user.actorId,
      lastActiveAccountingEntityId: accountingEntity.id,
    };

    await deps.userPreferencesService.update(updatePayload, { correlationId });

    deps.appContext.set({ accountingEntity });

    return accountingEntity;
  };
}
