import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import IRequestContext from '../../../shared/contracts/request-context.contract';

export default function makeGetUserAccountingEntitiesUseCase(
  requestContext: IRequestContext,
  accountingEntityRepo: IAccountingEntityRepo
) {
  return async () => {
    const { user, correlationId } = requestContext.get();

    const accountingEntities = await accountingEntityRepo.findByUserId(
      user.id,
      {
        correlationId,
      }
    );

    return accountingEntities;
  };
}
