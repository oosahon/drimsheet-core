import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import IAppContext from '../../../shared/contracts/app-context.contract';

interface IDependencies {
  appContext: IAppContext;
  accountingEntityRepo: IAccountingEntityRepo;
}

export default function makeGetUserAccountingEntitiesUseCase(
  deps: IDependencies
) {
  return async () => {
    const { user, correlationId } = deps.appContext.get();

    const accountingEntities = await deps.accountingEntityRepo.findByUserId(
      user.id,
      {
        correlationId,
      }
    );

    return accountingEntities;
  };
}
