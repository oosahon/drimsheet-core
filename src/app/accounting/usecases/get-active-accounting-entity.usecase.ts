import IAppContext from '../../_internal/contracts/app-context.contract';

interface IDeps {
  appContext: IAppContext;
}

export default function makeGetCurrentAccountingEntityUseCase(deps: IDeps) {
  return async () => {
    const { accountingEntity } = deps.appContext.get();

    return accountingEntity;
  };
}
