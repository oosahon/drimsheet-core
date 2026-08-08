import accountingAppError from '@app/accounting/errors/accounting.error';
import IAppContext from '@app/context/contracts/app-context.contract';

interface IDeps {
  appContext: IAppContext;
}

export default function makeGetCurrentAccountingEntityUseCase(deps: IDeps) {
  return async () => {
    const { accountingEntity } = deps.appContext.get();

    if (!accountingEntity.id) {
      throw new accountingAppError.ActiveEntityNotFound();
    }

    return accountingEntity;
  };
}
