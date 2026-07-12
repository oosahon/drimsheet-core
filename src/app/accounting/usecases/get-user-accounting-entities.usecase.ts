import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import IRequestContext from '../../shared/contracts/request-context.contract';

interface IDependencies {
  requestContext: IRequestContext;
  accountingEntityRepo: IAccountingEntityRepo;
}

export default function makeGetUserAccountingEntitiesUseCase(
  deps: IDependencies
) {
  return async () => {
    const { user, correlationId } = deps.requestContext.get();

    const accountingEntities = await deps.accountingEntityRepo.findByUserId(
      user.id,
      {
        correlationId,
      }
    );

    return accountingEntities;
  };
}
