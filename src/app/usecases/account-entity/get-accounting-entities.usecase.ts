import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import IRequestContext from '../../contracts/app/request-context.contract';
import accountingEntityMapper from '../../mappers/accounting-entity.mapper';

export default function getAllAccountingEntitiesUseCase(
  requestContext: IRequestContext,
  accountingEntityRepo: IAccountingEntityRepo
) {
  return async () => {
    const { user, correlationId } = requestContext.get();

    if (!user) {
      throw new ErrorUnauthorized();
    }

    const accountingEntities = await accountingEntityRepo.findByUserId(
      user.id,
      { correlationId }
    );

    return accountingEntities.map(accountingEntityMapper.toInterface);
  };
}
