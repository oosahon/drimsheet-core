import IAppContext from '../../context/contracts/app-context.contract';
import accountingAppError from '../errors/accounting.error';

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
