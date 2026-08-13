import { TEntityId } from '@shared/types/uuid';
import zodValidationRunner from '@shared/utils/zod-validation-runner';

import IAccountingEntityRepo from '@domain/accounting/repos/accounting-entity.repo';

import { IAccountingEntitySwitchReq } from '@app/accounting/dtos/accounting/accounting.dto';
import { accountingEntitySwitchReqSchema } from '@app/accounting/dtos/accounting/accounting.dto.validation';
import accountingAppError from '@app/accounting/errors/accounting.error';
import IAppContext from '@app/context/contracts/app-context.contract';

interface IDependencies {
  appContext: IAppContext;
  accountingEntityRepo: IAccountingEntityRepo;
}

export default function makeSwitchAccountingEntityUsecase(deps: IDependencies) {
  return async (payload: IAccountingEntitySwitchReq) => {
    zodValidationRunner(accountingEntitySwitchReqSchema, payload);

    const { user, correlationId } = deps.appContext.get();

    const accountingEntity = await deps.accountingEntityRepo.findByIdAndUserId(
      payload.accountingEntityId as TEntityId,
      user.id,
      { correlationId }
    );

    if (!accountingEntity) {
      throw new accountingAppError.ActiveEntityNotFound();
    }

    deps.appContext.set({ accountingEntity });

    return accountingEntity;
  };
}
